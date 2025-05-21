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
from fastapi.responses import RedirectResponse
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

# Import models from their new location
from src.models.mvp_model import ProfileData, CustomUrl, LinkData, MVPContentData

# New model for repository validation
class RepositoryValidationRequest(BaseModel):
    """Request model for repository validation"""
    repoFullName: str
    githubUsername: str

class RepositoryValidationResponse(BaseModel):
    """Response model for repository validation"""
    repositoryId: int
    exists: bool
    message: str

# Assuming a theme engine/manager exists or will be created
# This will be responsible for taking MVPContentData and a theme_id
# and returning a dictionary of {filepath: content_string}
from src.themes.engine import generate_themed_content_files # Placeholder for actual import

app = FastAPI(
    title="Quickfolio API",
    description="API for generating portfolio sites from resumes",
    version="0.1.0",
)

# Initialize services
content_generator = ContentGenerator()
github_service = GitHubService()

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Add CORS middleware with proper configuration
# Get frontend URL from environment or use default
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://quickfolio.onrender.com')
allowed_origins = [
    FRONTEND_URL,
    'https://quickfolio.onrender.com',
    'http://localhost:3000',  # For local development
    'http://127.0.0.1:3000',  # For local development
    'http://localhost:10000',  # For local production build
]

logger.info(f"Configuring CORS with allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Disposition"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

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
        temperature=0.1  # Lower temperature for more deterministic, structured output
    )
    generation_config.response_mime_type = "application/json" # Request JSON output directly
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
        # Get frontend URL from environment variable or fall back to production URL
        frontend_base = os.environ.get("FRONTEND_URL", "https://quickfolio.onrender.com")
        frontend_url = f"{frontend_base}/deploy-callback"
        query_params = "?" + "&".join([f"{k}={v}" for k, v in user_data.items() if v])
        redirect_url = frontend_url + query_params
        
        return RedirectResponse(url=redirect_url)
    except GitHubAuthError as e:
        # Redirect to frontend with error
        # Get frontend URL from environment variable or fall back to production URL
        frontend_base = os.environ.get("FRONTEND_URL", "https://quickfolio.onrender.com")
        error_url = f"{frontend_base}/deploy-callback?error={str(e)}"
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"Error in GitHub callback: {str(e)}", exc_info=True)
        # Get frontend URL from environment variable or fall back to production URL
        frontend_base = os.environ.get("FRONTEND_URL", "https://quickfolio.onrender.com")
        error_url = f"{frontend_base}/deploy-callback?error=Server+error"
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
        # Get frontend URL from environment variable or fall back to production URL
        frontend_base = os.environ.get("FRONTEND_URL", "https://quickfolio.onrender.com")
        error_redirect_url = f"{frontend_base}/create?error=app_install_url_failed"
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

    # Get frontend URL from environment variable or fall back to production URL
    frontend_url = os.environ.get("FRONTEND_URL", "https://quickfolio.onrender.com")
    frontend_target_url = f"{frontend_url}/create" # Target frontend page
    logger.info(f"Using frontend target URL: {frontend_target_url}")

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
    installation_id: int = Form(...),
    user_login: str = Form(...),
    repo_name: str = Form(...),
    generated_content: str = Form(...), # JSON string of MVPContentData
    theme: str = Form(...), # Theme ID, e.g., "lynx"
    portfolio_description: Optional[str] = Form("My Quickfolio-generated portfolio site"),
    private_repo: bool = Form(False)
):
    """
    Deploy a new portfolio site to GitHub Pages.
    1. Authenticates with GitHub App installation ID.
    2. Creates a new repository with a base theme template.
    3. Generates theme-specific content files from AI-generated data.
    4. Pushes the generated content files to the repository.
    """
    logger.info(f"Deployment request received for user: {user_login}, repo: {repo_name}, theme: {theme}")
    try:
        # 1. Get Installation Access Token
        token_info = github_service.get_installation_access_token(installation_id)
        if not token_info or not token_info[0]:
            raise GitHubAuthError("Failed to obtain installation access token.")
        installation_access_token = token_info[0]
        logger.info(f"Obtained installation access token for installation_id: {installation_id}")

        # 2. Parse generated_content JSON string into MVPContentData
        try:
            parsed_mvp_content_dict = json.loads(generated_content)
            mvp_content_data = MVPContentData(**parsed_mvp_content_dict)
            logger.info("Successfully parsed generated_content into MVPContentData.")
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError parsing generated_content: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid format for generated_content: {e}")
        except ValidationError as e:
            logger.error(f"ValidationError parsing generated_content into MVPContentData: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid data structure for generated_content: {e}")

        # 3. Prepare base theme template path
        selected_template_path = TEMPLATES_DIR / theme
        if not selected_template_path.is_dir():
            logger.error(f"Theme template directory not found: {selected_template_path}")
            raise HTTPException(status_code=400, detail=f"Theme '{theme}' not found.")
        logger.info(f"Using base theme template path: {selected_template_path}")
        
        # 4. Create GitHub Pages repository with the base theme template
        # This step creates the repo, pushes the initial theme files (including .github/workflows), 
        # and enables GitHub Pages.
        repo_full_name = f"{user_login}/{repo_name}"
        repo_html_url, pages_url = github_service.create_pages_repository(
            installation_access_token=installation_access_token,
            user_login=user_login,
            repo_name=repo_name,
            template_path=selected_template_path, 
            description=portfolio_description,
            private=private_repo
        )
        logger.info(f"Base repository created: {repo_html_url}, Pages URL pending build: {pages_url}")

        # 5. Generate theme-specific content files from MVPContentData
        # This function should return a Dict[str, str] where keys are filepaths relative to repo root
        # and values are the string content of those files.
        try:
            themed_content_files = generate_themed_content_files(theme_id=theme, mvp_data=mvp_content_data)
            logger.info(f"Generated {len(themed_content_files)} themed content files for theme '{theme}'.")
        except Exception as e:
            logger.error(f"Error generating themed content files: {e}", exc_info=True)
            # Depending on the desired behavior, we might proceed without custom content or raise error
            # For now, let's raise an error if content generation fails.
            raise HTTPException(status_code=500, detail=f"Failed to generate themed content: {e}")

        # 6. Push the generated themed content files to the repository
        if themed_content_files: # Only push if there's content to push
            try:
                commit_message = f"✨ feat: Add portfolio content generated by Quickfolio for theme '{theme}'"
                success = github_service.update_repository_content(
                    installation_access_token=installation_access_token,
                    full_repo_name=repo_full_name,
                    content_files=themed_content_files,
                    commit_message_prefix=commit_message # Using prefix as the full message here
                )
                if success:
                    logger.info(f"Successfully pushed themed content to {repo_full_name}.")
                else:
                    logger.warning(f"Failed to push themed content to {repo_full_name}, but repository was created.")
                    # Not raising an error here, as the repo is created and base theme is up.
                    # The pages_url might still be valid with default theme content.
            except Exception as e:
                logger.error(f"Error pushing themed content files to {repo_full_name}: {e}", exc_info=True)
                # Similar to above, log warning and proceed as base repo is up.
                logger.warning(f"Failed to push themed content to {repo_full_name} due to error: {e}")
        else:
            logger.info(f"No specific themed content files generated for theme '{theme}'; base theme deployed.")

        return DeploymentResponse(
            deployment_url=pages_url, # The live GitHub Pages URL (might take time to build)
            repository_url=repo_html_url, 
            message=f"Portfolio site '{repo_name}' deployment initiated. Content files are being processed."
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


@app.post("/api/github/validate-repository", response_model=RepositoryValidationResponse, tags=["GitHub"])
async def validate_repository(request: RepositoryValidationRequest):
    """
    Validate if a GitHub repository exists and return its ID.
    Uses GitHub API to check repository existence and fetch its unique ID.
    
    Args:
        request: Contains repoFullName (e.g. 'username/repo') and githubUsername
        
    Returns:
        Repository ID and existence status
    """
    logger.info(f"Repository validation requested for: {request.repoFullName} by {request.githubUsername}")
    
    # Parse the repository full name
    repo_parts = request.repoFullName.split('/')
    
    # Handle different repository name formats
    if len(repo_parts) == 2:
        # Format: username/repo-name
        owner, repo_name = repo_parts
    elif len(repo_parts) == 1 and request.repoFullName.endswith('.github.io'):
        # Format: username.github.io (user/organization site)
        owner = request.githubUsername
        repo_name = request.repoFullName  # Full name is the repo name
    else:
        # Invalid format
        return RepositoryValidationResponse(
            repositoryId=0,
            exists=False,
            message=f"Invalid repository format: '{request.repoFullName}'. Expected 'username/repo-name' or 'username.github.io'."
        )
    
    try:
        # Use GitHubService to validate the repository
        exists, repo_id, error_message = github_service.validate_repository(owner, repo_name)
        
        if exists and repo_id:
            return RepositoryValidationResponse(
                repositoryId=repo_id,
                exists=True,
                message=f"Repository '{request.repoFullName}' validated successfully."
            )
        else:
            return RepositoryValidationResponse(
                repositoryId=0,
                exists=False,
                message=error_message or f"Repository '{request.repoFullName}' not found or not accessible."
            )
    except GitHubRepoError as e:
        logger.error(f"Error validating repository: {e}")
        return RepositoryValidationResponse(
            repositoryId=0,
            exists=False,
            message=f"Error validating repository: {str(e)}"
        )


def start():
    """Start the FastAPI application using uvicorn."""
    import uvicorn
    from src.config import HOST, PORT, DEBUG
    
    uvicorn.run("src.api.app:app", host=HOST, port=PORT, reload=DEBUG)


if __name__ == "__main__":
    start()
