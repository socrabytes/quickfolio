#!/usr/bin/env python3
"""
GitHub OAuth Test Script

This script tests the GitHub OAuth integration in Quickfolio.
It prints the OAuth URL to access manually in a browser.
"""
import os
import sys
from pathlib import Path

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.github.repo_service import GitHubService
from src.config import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL


def main():
    """Test GitHub OAuth integration."""
    # Check if GitHub OAuth credentials are configured
    if not GITHUB_CLIENT_ID or GITHUB_CLIENT_ID == "your_github_client_id_here":
        print("Error: GitHub OAuth credentials not configured.")
        print("Please update your .env file with valid GitHub OAuth credentials:")
        print("GITHUB_CLIENT_ID=your_client_id_from_github")
        print("GITHUB_CLIENT_SECRET=your_client_secret_from_github")
        print("GITHUB_CALLBACK_URL=http://localhost:8000/github/callback")
        return 1
    
    # Initialize GitHub service
    github_service = GitHubService()
    
    # Get OAuth URL
    oauth_url = github_service.get_oauth_url()
    
    print("\n=== GitHub OAuth Test ===")
    print("\nGitHub OAuth URL:")
    print(oauth_url)
    print("\nInstructions:")
    print("1. Start the API server with: python main.py api")
    print("2. Open the URL above in your browser")
    print("3. Authorize the application when prompted")
    print("4. You should be redirected to the callback URL")
    print("5. The API will return your GitHub user information and access token")
    print("\nNote: In a production environment, never expose the access token to clients.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
