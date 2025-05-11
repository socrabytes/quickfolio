"""
Quickfolio API

Main FastAPI application that handles resume parsing, content generation,
and GitHub repository creation for portfolio sites.
"""
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.parser.pdf_to_json import get_resume_json, PDFParseError
from src.ai.content_generator import ContentGenerator, GenerationRequest
from src.github.repo_service import GitHubService, GitHubUser, GitHubAuthError, GitHubRepoError
from src.config import TEMPLATES_DIR


app = FastAPI(
    title="Quickfolio API",
    description="API for generating portfolio sites from resumes",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
content_generator = ContentGenerator()
github_service = GitHubService()


class ResumeUploadResponse(BaseModel):
    """Response model for resume upload endpoint."""
    session_id: str
    resume_data: Dict[str, Any]
    message: str


class ContentGenerationResponse(BaseModel):
    """Response model for content generation endpoint."""
    session_id: str
    content: Dict[str, Any]
    message: str


class DeploymentResponse(BaseModel):
    """Response model for deployment endpoint."""
    deployment_url: str
    repository_url: str
    message: str


@app.get("/")
async def root():
    """Root endpoint that returns API information."""
    return {
        "name": "Quickfolio API",
        "version": "0.1.0",
        "description": "Generate portfolio sites from resumes",
    }


@app.post("/upload-resume", response_model=ResumeUploadResponse)
async def upload_resume(resume_file: UploadFile = File(...)):
    """
    Upload and parse a resume PDF.
    
    Args:
        resume_file: PDF resume file
        
    Returns:
        Parsed resume data and session ID
    """
    # Validate file type
    if not resume_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Save uploaded file to temp directory
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file_path = temp_file.name
            content = await resume_file.read()
            temp_file.write(content)
        
        # Parse resume
        resume_data = get_resume_json(temp_file_path)
        
        # Generate session ID
        import uuid
        session_id = str(uuid.uuid4())
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return ResumeUploadResponse(
            session_id=session_id,
            resume_data=resume_data,
            message="Resume successfully parsed",
        )
    except PDFParseError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")


@app.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_content(
    session_id: str = Form(...),
    resume_data: str = Form(...),
    tone: str = Form("professional"),
):
    """
    Generate enhanced content from resume data.
    
    Args:
        session_id: Session identifier
        resume_data: JSON string of resume data
        tone: Desired tone for content generation
        
    Returns:
        Generated content for portfolio
    """
    try:
        import json
        resume_json = json.loads(resume_data)
        
        # Create generation request
        request = GenerationRequest(
            resume_data=resume_json,
            tone=tone,
        )
        
        # Generate content
        content = content_generator.generate_all_content(request)
        
        return ContentGenerationResponse(
            session_id=session_id,
            content=content.dict(),
            message="Content successfully generated",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {str(e)}")


@app.get("/github/login")
async def github_login():
    """
    Initiate GitHub OAuth flow.
    
    Returns:
        Redirect to GitHub authorization page
    """
    oauth_url = github_service.get_oauth_url()
    return RedirectResponse(url=oauth_url)


@app.get("/github/callback")
async def github_callback(code: str, state: Optional[str] = None):
    """
    Handle GitHub OAuth callback.
    
    Args:
        code: OAuth code from GitHub
        state: State parameter for security validation
        
    Returns:
        User information and access token
    """
    try:
        # Exchange code for token
        access_token = github_service.exchange_code_for_token(code)
        
        # Get user info
        user = github_service.get_user_info(access_token)
        
        return {
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "access_token": access_token,  # In production, don't expose this
        }
    except GitHubAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during GitHub authentication: {str(e)}")


@app.post("/deploy", response_model=DeploymentResponse)
async def deploy_portfolio(
    access_token: str = Form(...),
    resume_data: str = Form(...),
    generated_content: str = Form(...),
    theme: str = Form("minimal"),
):
    """
    Deploy portfolio site to GitHub Pages.
    
    Args:
        access_token: GitHub OAuth access token
        resume_data: JSON string of resume data
        generated_content: JSON string of generated content
        theme: Theme to use for the portfolio
        
    Returns:
        Deployment information
    """
    try:
        import json
        resume_json = json.loads(resume_data)
        content_json = json.loads(generated_content)
        
        # Get user info
        user = github_service.get_user_info(access_token)
        
        # Create GitHub Pages repository
        template_path = TEMPLATES_DIR
        site_url = github_service.create_pages_repository(access_token, template_path)
        
        # TODO: Implement actual content deployment
        # This would involve:
        # 1. Generating Hugo content files from resume_json and content_json
        # 2. Applying the selected theme
        # 3. Pushing the files to the GitHub repository
        
        return DeploymentResponse(
            deployment_url=site_url,
            repository_url=f"https://github.com/{user.username}/{user.username}.github.io",
            message="Portfolio successfully deployed",
        )
    except GitHubRepoError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deploying portfolio: {str(e)}")


@app.get("/themes")
async def list_themes():
    """
    List available portfolio themes.
    
    Returns:
        List of available themes with metadata
    """
    from src.config import AVAILABLE_THEMES
    return {"themes": AVAILABLE_THEMES}


def start():
    """Start the FastAPI application using uvicorn."""
    import uvicorn
    from src.config import HOST, PORT, DEBUG
    
    uvicorn.run("src.api.app:app", host=HOST, port=PORT, reload=DEBUG)


if __name__ == "__main__":
    start()
