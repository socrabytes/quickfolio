#!/usr/bin/env python3
"""
Test script for GitHub integration.

This script tests the GitHub OAuth flow and repository operations.
It requires GitHub credentials to be set in the environment.
"""
import argparse
import json
import os
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.github.repo_service import GitHubService, GitHubAuthError, GitHubRepoError


def test_oauth_url():
    """Test generating the GitHub OAuth URL."""
    github_service = GitHubService()
    oauth_url = github_service.get_oauth_url()
    
    print(f"GitHub OAuth URL: {oauth_url}")
    print("\nOpen this URL in your browser to authorize the application.")
    print("After authorization, you'll be redirected to the callback URL.")
    print("Copy the 'code' parameter from the URL and use it with the --code option.")
    
    return True


def test_token_exchange(code):
    """Test exchanging the OAuth code for an access token."""
    github_service = GitHubService()
    
    try:
        access_token = github_service.exchange_code_for_token(code)
        print(f"Access token obtained: {access_token[:5]}...")
        return access_token
    except GitHubAuthError as e:
        print(f"Error exchanging code for token: {e}")
        return None


def test_user_info(access_token):
    """Test getting user information using the access token."""
    github_service = GitHubService()
    
    try:
        user = github_service.get_user_info(access_token)
        print(f"User information obtained:")
        print(f"  Username: {user.username}")
        print(f"  Name: {user.name}")
        print(f"  Email: {user.email}")
        return user
    except GitHubAuthError as e:
        print(f"Error getting user info: {e}")
        return None


def main():
    """Main entry point for the GitHub integration test script."""
    parser = argparse.ArgumentParser(description="Test GitHub integration")
    parser.add_argument(
        "--code",
        type=str,
        help="OAuth code from callback URL"
    )
    parser.add_argument(
        "--token",
        type=str,
        help="GitHub access token (if you already have one)"
    )
    
    args = parser.parse_args()
    
    if not args.code and not args.token:
        # No code or token provided, generate OAuth URL
        test_oauth_url()
        return 0
    
    access_token = args.token
    if args.code:
        # Exchange code for token
        access_token = test_token_exchange(args.code)
        if not access_token:
            return 1
    
    # Get user info
    user = test_user_info(access_token)
    if not user:
        return 1
    
    print("\nGitHub integration test completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
