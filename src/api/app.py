"""
Quickfolio API

Main FastAPI application that handles resume parsing, content generation,
and GitHub repository creation for portfolio sites.
"""
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, Depends, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pydantic import HttpUrl

from src.parser.pdf_to_json import get_resume_json, PDFParseError
from src.ai.content_generator import ContentGenerator, GenerationRequest
from src.github.repo_service import GitHubService, GitHubUser, GitHubAuthError, GitHubRepoError
from src.config import TEMPLATES_DIR
import logging
import json
import google.generativeai as genai
from pydantic import ValidationError

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

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Get API key from config which loads from .env
from src.config import GEMINI_API_KEY, GEMINI_MODEL

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables. AI features will not work.")
    # Depending on desired behavior, could raise an error or allow app to run with AI disabled
else:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info(f"Using Gemini model: {GEMINI_MODEL}")

# --- Existing Pydantic Models ---
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


# --- New MVP Models ---
class ProfileData(BaseModel):
    """Profile data for the link-in-bio page"""
    name: str
    headline: str
    avatar: str # e.g., "avatar.jpg" - user provides file, AI suggests filename

# Custom validator for URLs that allows mailto: and tel: schemes
from pydantic import AnyUrl, field_validator

class CustomUrl(AnyUrl):
    """Custom URL type that allows mailto: and tel: schemes"""
    @classmethod
    def validate_url(cls, value: str) -> str:
        # Handle special URL schemes
        if value.startswith('mailto:') or value.startswith('tel:') or value == '#':
            return value
        # Let parent handle standard http/https URLs
        return super().validate_url(value)

class LinkData(BaseModel):
    """Link data for the link-in-bio page"""
    text: str
    url: str  # We'll validate this with a custom validator
    icon: Optional[str] = None # e.g., "linkedin", "github"
    type: Optional[str] = None # e.g., "social", "project", "document"
    
    # Validate URLs allowing special schemes
    @field_validator('url')
    def validate_url(cls, v: str) -> str:
        # Allow special schemes
        if v.startswith('mailto:') or v.startswith('tel:') or v == '#':
            return v
        # Check for http/https schemes
        if not v.startswith('http://') and not v.startswith('https://'):
            v = 'https://' + v  # Add https:// prefix if missing
        # No validation beyond this - we've already normalized in the processing function
        return v

class MVPContentData(BaseModel):
    """Structure for the complete MVP content"""
    profile: ProfileData
    links: List[LinkData]

class MVPContentGenerationRequest(BaseModel):
    """Request model for MVP content generation endpoint"""
    resume_text: str
    # No tone needed, prompt will be specific

class MVPContentGenerationResponse(BaseModel):
    """Response model for MVP content generation endpoint"""
    mvp_content: Optional[MVPContentData] = None  # The structured content if successful
    raw_ai_response: Optional[str] = None  # Raw response from AI
    error: Optional[str] = None  # Error message if any
    debug_info: Optional[Dict[str, Any]] = None  # Debug information # For storing detailed prompt/response for AI debugging


@app.get("/", tags=["General"])
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


@app.post("/generate-mvp-content", response_model=MVPContentGenerationResponse)
async def generate_mvp_content(request: MVPContentGenerationRequest):
    """
    Generate structured Profile and Links data for the MVP link-in-bio page
    from raw resume text using Gemini AI.
    """
    if not GEMINI_API_KEY:
        logger.error("Attempted to call /generate-mvp-content but GEMINI_API_KEY is not set.")
        raise HTTPException(status_code=500, detail="AI service is not configured (API key missing).")

    resume_text = request.resume_text

    prompt = f"""
You are an expert resume parser and content extractor. Your task is to extract specific information from the provided resume text and format it as a JSON object. The JSON object must strictly adhere to the following structure:

{{
  "profile": {{
    "name": "string (Full name of the person)",
    "headline": "string (A concise and compelling headline or bio, 20 words max. Example: 'Software Engineer at XYZ Corp | Building innovative web solutions')",
    "avatar": "string (Always output 'avatar.jpg' for this field)"
  }},
  "links": [
    {{
      "text": "string (Display text for the link, e.g., 'LinkedIn Profile', 'GitHub', 'Personal Website', 'Project Alpha Demo')",
      "url": "string (The full URL, e.g., 'https://linkedin.com/in/username')",
      "icon": "string (Suggest an icon name from this list if applicable: 'linkedin', 'github', 'twitter', 'facebook', 'instagram', 'youtube', 'blog', 'website', 'file-pdf', 'envelope', 'phone', 'link'. Otherwise, use 'link'.)",
      "type": "string (Categorize the link as 'social', 'portfolio', 'project', 'contact', or 'other')"
    }}
    // Add more link objects as found in the resume, up to 7-10 relevant links.
  ]
}}

Instructions for extraction:
1. Profile - Name: Extract the full name of the individual.
2. Profile - Headline: Create a concise (max 20 words) professional headline from summary, current role, or experience. If none, use most recent job title/company.
3. Profile - Avatar: Always return "avatar.jpg".
4. Links:
   - Scan for URLs (social media, websites, projects, email, phone).
   - `text`: Descriptive (e.g., "LinkedIn", "Project X", "Email", "Phone").
   - `url`: Full URL (e.g., mailto:email@example.com, tel:+1234567890).
   - `icon`: Choose from: 'linkedin', 'github', 'twitter', 'facebook', 'instagram', 'youtube', 'blog', 'website', 'file-pdf', 'envelope', 'phone', 'link'. Default to 'link'.
   - `type`: Categorize: 'social', 'portfolio', 'project', 'contact', 'other'.
   - Prioritize official/professional links (LinkedIn, GitHub, personal site).
   - Include up to 7-10 most relevant links.
   - If resume PDF link found, include as: text "View Resume", icon "file-pdf", type "document".

Resume Text to Process:
---
{resume_text}
---

Ensure your entire output is a single, valid JSON object, starting with {{ and ending with }}. Do not include any text or explanations before or after the JSON object.
"""

    model_name = os.getenv("GEMINI_MODEL", "models/gemini-1.5-flash-latest")
    generation_config = genai.types.GenerationConfig(
        candidate_count=1,
        temperature=0.1, # Lower temperature for more deterministic, structured output
        response_mime_type="application/json" # Request JSON output directly
    )
    safety_settings = [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
        }
    ]

    logger.info(f"Sending request to Gemini model: {model_name} for MVP content generation.")
    # logger.debug(f"Prompt: \n{prompt}") # Be cautious logging full resume text

    try:
        model = genai.GenerativeModel(model_name=model_name, generation_config=generation_config, safety_settings=safety_settings)
        response = await model.generate_content_async(prompt)
        raw_ai_response = response.text
        logger.info("Received response from Gemini.")
        # logger.debug(f"Raw AI Response: \n{raw_ai_response}")

        def normalize_urls(data):
            """Normalize URLs to ensure they have proper protocols before validation."""
            if isinstance(data, dict):
                if "links" in data and isinstance(data["links"], list):
                    for link in data["links"]:
                        if "url" in link and isinstance(link["url"], str):
                            url = link["url"].strip()
                            
                            # Special cases for common protocols
                            if url.startswith("mailto:") or url.startswith("tel:"):
                                # Keep these as-is, we'll handle them in the MVPContentData model
                                link["url"] = url
                            # Add protocol if missing
                            elif not url.startswith("http://") and not url.startswith("https://"):
                                # Handle special cases for common sites
                                if url == "#" or url.startswith("#"):
                                    # Keep anchor links as-is
                                    link["url"] = url
                                else:
                                    # Add https:// prefix to all other URLs
                                    link["url"] = "https://" + url
            return data
        
        try:
            parsed_json = json.loads(raw_ai_response)
            # Normalize URLs before validation
            normalized_json = normalize_urls(parsed_json)
            
            try:
                mvp_data = MVPContentData(**normalized_json)
                return MVPContentGenerationResponse(
                    mvp_content=mvp_data,
                    raw_ai_response=raw_ai_response,
                    debug_info={"prompt_length": len(prompt), "model_used": model_name}
                )
            except ValidationError as e:
                # If validation still fails after normalization, log the normalized JSON
                logger.error(f"ValidationError after URL normalization: {e}")
                logger.error(f"Normalized JSON that failed validation: {normalized_json}")
                
                # Fall back to a more permissive approach for demo purposes
                logger.info("Attempting to recover with manual validation and correction...")
                return MVPContentGenerationResponse(
                    error=f"AI response failed data validation: {e}",
                    raw_ai_response=raw_ai_response,
                    debug_info={"prompt_length": len(prompt), "model_used": model_name, "parsed_json_failing_validation": normalized_json}
                )
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError parsing AI response: {e}")
            logger.error(f"Problematic AI Response: {raw_ai_response}")
            return MVPContentGenerationResponse(
                error=f"Failed to parse AI response as JSON: {e}",
                raw_ai_response=raw_ai_response,
                debug_info={"prompt_length": len(prompt), "model_used": model_name}
            )
        except ValidationError as e: # Pydantic validation error
            logger.error(f"ValidationError validating parsed AI response: {e}")
            logger.error(f"Parsed JSON that failed validation: {parsed_json}") # Log the JSON that failed
            return MVPContentGenerationResponse(
                error=f"AI response failed data validation: {e}",
                raw_ai_response=raw_ai_response,
                debug_info={"prompt_length": len(prompt), "model_used": model_name, "parsed_json_failing_validation": parsed_json}
            )

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}", exc_info=True)
        # Check for specific Gemini API errors if the SDK provides them
        # For example, if hasattr(e, 'message'): error_detail = e.message
        return MVPContentGenerationResponse(
            error=f"An unexpected error occurred with the AI service: {str(e)}",
            debug_info={"prompt_length": len(prompt), "model_used": model_name}
        )


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
        Redirect to frontend with user information and access token
    """
    try:
        # Exchange code for token
        access_token = github_service.exchange_code_for_token(code)
        
        # Get user info
        user = github_service.get_user_info(access_token)
        
        # Create a parameter string with user data
        user_data = {
            "username": user.username,
            "name": user.name or user.username,
            "avatar_url": user.avatar_url,
            "access_token": access_token  # In production, don't expose this
        }
        
        # Redirect to frontend with data
        # Frontend URL hardcoded for simplicity - in production use an env var
        frontend_url = "http://localhost:3000/deploy-callback"
        query_params = "?" + "&".join([f"{k}={v}" for k, v in user_data.items() if v])
        redirect_url = frontend_url + query_params
        
        return RedirectResponse(url=redirect_url)
    except GitHubAuthError as e:
        # Redirect to frontend with error
        error_url = f"http://localhost:3000/deploy-callback?error={str(e)}"
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"Error in GitHub callback: {str(e)}", exc_info=True)
        error_url = f"http://localhost:3000/deploy-callback?error=Server+error"
        return RedirectResponse(url=error_url)


# --- GitHub App Installation Flow --- 

@app.get("/github/app/install", tags=["GitHub App"])
async def github_app_install_redirect(request: Request):
    """
    Redirects the user to the GitHub App installation page.
    Generates the installation URL for the Quickfolio GitHub App.
    """
    try:
        # The state parameter is optional for get_github_app_installation_url
        # If you want to use it for CSRF protection, generate a unique state, 
        # store it in the user's session, and verify it in the callback.
        # For simplicity, we're not implementing state validation here yet.
        installation_url = github_service.get_github_app_installation_url()
        logger.info(f"Redirecting to GitHub App installation URL: {installation_url}")
        return RedirectResponse(url=installation_url)
    except Exception as e:
        logger.error(f"Error generating GitHub App installation URL: {str(e)}", exc_info=True)
        # Redirect to a frontend page with an error message
        # Ensure your frontend can handle this query parameter for error display.
        error_redirect_url = "http://localhost:3000/create?error=app_install_url_failed"
        return RedirectResponse(url=error_redirect_url, status_code=302) # Use 302 for temporary redirect


class GitHubAppCallbackQueryParams(BaseModel):
    """Query parameters expected from GitHub App callback."""
    code: Optional[str] = None
    installation_id: Optional[int] = None
    setup_action: Optional[str] = None # e.g., "install", "update"
    state: Optional[str] = None # If state was used in the installation URL


@app.get("/github/app/callback", tags=["GitHub App"])
async def github_app_callback(
    request: Request, # FastAPI request object for session access, etc.
    params: GitHubAppCallbackQueryParams = Depends() # Dependency injection for query params
):
    """
    Handles the callback from GitHub after a user installs or configures the GitHub App.
    Receives the installation_id which is crucial for making API calls on behalf of the installation.
    """
    logger.info(
        f"GitHub App Callback received: installation_id={params.installation_id}, "
        f"setup_action={params.setup_action}, code={params.code}, state={params.state}"
    )

    # TODO: Implement state validation if CSRF protection state was used in /github/app/install
    # if not github_service.validate_state(params.state, request.session.pop('github_oauth_state', None)):
    #     raise HTTPException(status_code=403, detail="Invalid OAuth state.")

    frontend_target_url = "http://localhost:3000/create" # Target frontend page

    if params.installation_id:
        # Successfully received installation_id
        logger.info(f"GitHub App installation event: ID={params.installation_id}, Action={params.setup_action}")
        
        # Store installation_id: This is critical. How you store it depends on your app's architecture.
        # Option 1: Session (requires SessionMiddleware)
        # request.session['github_installation_id'] = params.installation_id
        # logger.info(f"Stored installation_id {params.installation_id} in session.")

        # Option 2: If your app uses user accounts, associate installation_id with the user's account in your DB.

        # Option 3: For stateless operation or to immediately pass to client, redirect with it.
        # The client would then store it (e.g., localStorage) and send it with subsequent API requests (like /deploy).
        redirect_query_params = f"?installation_id={params.installation_id}"
        if params.setup_action:
            redirect_query_params += f"&setup_action={params.setup_action}"
        
        # You might want to fetch initial user/installation details here if needed
        # try:
        #     token_info = github_service.get_installation_access_token(params.installation_id)
        #     installation_token = token_info[0]
        #     # Example: Fetch owner info if your service supports it
        #     # owner_info = github_service.get_installation_owner_info(installation_token)
        #     # logger.info(f"App installed for: {owner_info}")
        #     # request.session['github_installation_owner_login'] = owner_info.login
        # except Exception as e:
        #     logger.error(f"Could not retrieve token or info for installation {params.installation_id}: {e}")
            # Decide how to handle this - redirect with error or just log and continue?

        logger.info(f"Redirecting to frontend: {frontend_target_url}{redirect_query_params}")
        return RedirectResponse(url=f"{frontend_target_url}{redirect_query_params}")
    
    elif params.code and params.state: # This scenario is usually for 'Request user authorization (OAuth) during installation'
        # This 'code' is part of the GitHub App's own OAuth flow, distinct from a separate OAuth App flow.
        # It's used to get a user token specific to the app installation.
        logger.info(f"GitHub App callback received OAuth code for user authorization: {params.code}")
        # You would typically exchange this code for a user token using a method like:
        # user_app_token_data = await github_service.exchange_user_auth_code_for_app_token(params.code, params.state)
        # Then store this token, possibly linking it to the user and installation_id.
        # For now, redirecting with a status.
        return RedirectResponse(url=f"{frontend_target_url}?status=app_user_auth_code_received")

    else:
        logger.error(f"GitHub App Callback error: Missing critical parameters. Query: {request.query_params}")
        return RedirectResponse(url=f"{frontend_target_url}?error=app_callback_invalid_params")


@app.post("/deploy", response_model=DeploymentResponse)
async def deploy_portfolio(
    installation_id: int = Form(...),      # New: From GitHub App installation
    user_login: str = Form(...),           # New: GitHub username of the installer
    generated_content: str = Form(...),    # Assuming this contains structured data like MVPContentData as JSON string
    theme: str = Form("lynx"),             # Defaulting to 'lynx' from memory
    repo_name: str = Form(...),            # Now required, no longer optional or using user.login.github.io
    portfolio_description: Optional[str] = Form("My Quickfolio-generated portfolio site"),
    private_repo: bool = Form(False)
):
    """
    Deploy portfolio site to GitHub Pages using GitHub App installation.
    
    Args:
        installation_id: GitHub App installation ID.
        user_login: GitHub username of the account where the app is installed.
        generated_content: JSON string of portfolio content (e.g., MVPContentData).
        theme: Theme to use for the portfolio.
        repo_name: Desired repository name (e.g., "my-portfolio").
        portfolio_description: Description for the new repository.
        private_repo: Whether the repository should be private.
        
    Returns:
        Deployment information (repository URL and GitHub Pages URL).
    """
    logger.info(
        f"Deployment request: installation_id={installation_id}, user_login='{user_login}', "
        f"repo_name='{repo_name}', theme='{theme}', private={private_repo}"
    )

    try:
        # 1. Get installation access token for the given installation_id
        token_info = github_service.get_installation_access_token(installation_id)
        installation_access_token = token_info[0] # The token string
        # token_expires_at = token_info[1] # Expiration datetime, useful for caching if needed
        logger.info(f"Obtained installation access token for installation_id: {installation_id}")

        # 2. Prepare template path (this needs to be robust)
        #    The 'theme' parameter should map to a directory in TEMPLATES_DIR
        #    For now, assuming 'theme' directly corresponds to a subdirectory name.
        #    E.g., if TEMPLATES_DIR is 'src/templates' and theme is 'lynx', path is 'src/templates/lynx'
        #    This path should contain the actual site files (HTML, CSS, JS, images, .github/workflows/*)
        selected_template_path = TEMPLATES_DIR / theme
        if not selected_template_path.is_dir():
            logger.error(f"Theme template directory not found: {selected_template_path}")
            raise HTTPException(status_code=400, detail=f"Theme '{theme}' not found.")
        logger.info(f"Using template path: {selected_template_path}")
        
        # TODO: Actual content processing using `generated_content` and `theme`.
        # For now, we are focused on the GitHub interaction part.
        # This would involve:
        # 1. Parsing `generated_content` (JSON string) into Python objects (e.g., MVPContentData).
        # 2. Using a theme-specific generator to create the actual HTML/config files 
        #    and place them into a temporary directory that will be used by `_push_template_to_repo`.
        #    The `template_path` argument for `create_pages_repository` would then point to this temporary directory.
        #    For this step, let's assume `selected_template_path` *is* the directory with final files.
        
        # 3. Create GitHub Pages repository and push the template content
        repo_html_url, pages_url = github_service.create_pages_repository(
            installation_access_token=installation_access_token,
            user_login=user_login,
            repo_name=repo_name,
            template_path=selected_template_path, # This should be the path to the fully generated site files
            description=portfolio_description,
            private=private_repo
        )
        
        logger.info(f"Repository created: {repo_html_url}, Pages URL: {pages_url}")
        
        return DeploymentResponse(
            deployment_url=pages_url, # The live GitHub Pages URL
            repository_url=repo_html_url, # The URL of the GitHub repository itself
            message=f"Portfolio site '{repo_name}' deployment initiated successfully."
        )
        
    except GitHubAuthError as e:
        logger.error(f"GitHub Auth Error during deployment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail=f"GitHub authentication error: {str(e)}")
    except GitHubRepoError as e:
        logger.error(f"GitHub Repo Error during deployment: {str(e)}", exc_info=True)
        # More specific error for already existing repo could be handled here if desired
        if "already exists" in str(e):
             raise HTTPException(status_code=409, detail=str(e)) # 409 Conflict
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise # Re-raise HTTPException to preserve its status code and detail
    except Exception as e:
        logger.error(f"Unexpected error during deployment: {str(e)}", exc_info=True)
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
