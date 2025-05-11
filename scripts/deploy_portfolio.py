#!/usr/bin/env python3
"""
Deploy Portfolio Script

This script automates the process of deploying a portfolio site to GitHub Pages.
It handles the entire workflow from resume parsing to GitHub repository creation.
"""
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.parser.pdf_to_json import get_resume_json, PDFParseError
from src.ai.content_generator import ContentGenerator, GenerationRequest
from src.github.repo_service import GitHubService, GitHubAuthError, GitHubRepoError
from src.utils.hugo_generator import create_site_from_template
from src.config import TEMPLATES_DIR, get_theme_path


def parse_resume(pdf_path):
    """Parse resume from PDF."""
    try:
        print(f"Parsing resume: {pdf_path}")
        resume_data = get_resume_json(pdf_path)
        print("✅ Resume parsed successfully")
        return resume_data
    except PDFParseError as e:
        print(f"❌ Error parsing resume: {e}", file=sys.stderr)
        sys.exit(1)


def generate_content(resume_data, tone):
    """Generate enhanced content using AI."""
    try:
        print("Generating enhanced content with AI...")
        generator = ContentGenerator()
        request = GenerationRequest(resume_data=resume_data, tone=tone)
        content = generator.generate_all_content(request)
        print("✅ Content generated successfully")
        return content.dict()
    except Exception as e:
        print(f"❌ Error generating content: {e}", file=sys.stderr)
        sys.exit(1)


def create_site(resume_data, content, theme, output_path=None):
    """Create Hugo site from resume data and content."""
    try:
        print(f"Creating portfolio site with {theme} theme...")
        
        # Use temporary directory if no output path specified
        if output_path is None:
            output_dir = tempfile.mkdtemp()
            output_path = Path(output_dir)
        else:
            output_path = Path(output_path)
            
        theme_path = get_theme_path(theme)
        if not theme_path:
            print(f"❌ Theme '{theme}' not found", file=sys.stderr)
            sys.exit(1)
            
        site_path = create_site_from_template(
            output_path=output_path,
            theme=theme,
            resume_data=resume_data,
            generated_content=content
        )
        
        print(f"✅ Site created at: {site_path}")
        return site_path
    except Exception as e:
        print(f"❌ Error creating site: {e}", file=sys.stderr)
        sys.exit(1)


def deploy_to_github(site_path, access_token=None):
    """Deploy site to GitHub Pages."""
    try:
        github_service = GitHubService()
        
        # If no token provided, start OAuth flow
        if not access_token:
            print("No GitHub access token provided. Starting OAuth flow...")
            oauth_url = github_service.get_oauth_url()
            print(f"Open this URL in your browser to authorize: {oauth_url}")
            code = input("Enter the code from the callback URL: ")
            access_token = github_service.exchange_code_for_token(code)
            
        # Get user info
        user = github_service.get_user_info(access_token)
        print(f"Authenticated as: {user.username}")
        
        # Create GitHub Pages repository
        print(f"Creating GitHub Pages repository for {user.username}...")
        site_url = github_service.create_pages_repository(access_token, site_path)
        
        print(f"✅ Portfolio deployed successfully!")
        print(f"🚀 Your portfolio is available at: {site_url}")
        print(f"📁 Repository: https://github.com/{user.username}/{user.username}.github.io")
        
        return site_url
    except GitHubAuthError as e:
        print(f"❌ GitHub authentication error: {e}", file=sys.stderr)
        sys.exit(1)
    except GitHubRepoError as e:
        print(f"❌ GitHub repository error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main entry point for the deploy portfolio script."""
    parser = argparse.ArgumentParser(
        description="Deploy a portfolio site to GitHub Pages from a resume"
    )
    parser.add_argument(
        "resume_pdf",
        type=str,
        help="Path to the resume PDF file"
    )
    parser.add_argument(
        "--theme",
        type=str,
        default="minimal",
        choices=["minimal"],  # Add more themes as they become available
        help="Theme to use for the portfolio (default: minimal)"
    )
    parser.add_argument(
        "--tone",
        type=str,
        default="professional",
        choices=["professional", "casual", "academic"],
        help="Tone for the generated content (default: professional)"
    )
    parser.add_argument(
        "--token",
        type=str,
        help="GitHub access token (if not provided, OAuth flow will be used)"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output directory for the generated site (optional)"
    )
    parser.add_argument(
        "--skip-deploy",
        action="store_true",
        help="Skip GitHub deployment and only generate the site"
    )
    
    args = parser.parse_args()
    
    # Parse resume
    resume_data = parse_resume(args.resume_pdf)
    
    # Generate content
    content = generate_content(resume_data, args.tone)
    
    # Create site
    site_path = create_site(resume_data, content, args.theme, args.output)
    
    # Deploy to GitHub (unless skipped)
    if not args.skip_deploy:
        deploy_to_github(site_path, args.token)
    else:
        print(f"Skipping GitHub deployment. Site is available at: {site_path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
