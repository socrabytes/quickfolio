"""
GitHub Repository Service

This module handles GitHub OAuth authentication and repository operations
for creating and managing portfolio sites on GitHub Pages.
"""
from dataclasses import dataclass
import os
from pathlib import Path
import tempfile
from typing import Dict, List, Optional, Tuple, Any

import requests
from github import Github, GithubException, Repository, AuthenticatedUser

from src.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
)


class GitHubAuthError(Exception):
    """Exception raised when GitHub authentication fails."""
    pass


class GitHubRepoError(Exception):
    """Exception raised when repository operations fail."""
    pass


@dataclass
class GitHubUser:
    """GitHub user information."""
    username: str
    name: Optional[str]
    email: Optional[str]
    avatar_url: Optional[str]
    access_token: str


class GitHubService:
    """
    Service for GitHub authentication and repository operations.
    
    This class handles OAuth authentication flow and repository
    creation/management for GitHub Pages deployment.
    """
    
    def __init__(self) -> None:
        """Initialize the GitHub service with configuration."""
        self.client_id = GITHUB_CLIENT_ID
        self.client_secret = GITHUB_CLIENT_SECRET
        self.callback_url = GITHUB_CALLBACK_URL
    
    def get_oauth_url(self) -> str:
        """
        Get the GitHub OAuth authorization URL.
        
        Returns:
            URL to redirect the user for GitHub authorization
        """
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={self.client_id}"
            f"&redirect_uri={self.callback_url}"
            f"&scope=user:email,repo"
            f"&state={self._generate_state_token()}"
        )
    
    def _generate_state_token(self) -> str:
        """
        Generate a state token for OAuth security.
        
        Returns:
            Random state token string
        """
        import uuid
        return str(uuid.uuid4())
    
    def exchange_code_for_token(self, code: str) -> str:
        """
        Exchange OAuth code for access token.
        
        Args:
            code: OAuth code from callback
            
        Returns:
            GitHub access token
            
        Raises:
            GitHubAuthError: If token exchange fails
        """
        try:
            response = requests.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.callback_url,
                },
                headers={"Accept": "application/json"},
            )
            
            response.raise_for_status()
            data = response.json()
            
            if "error" in data:
                raise GitHubAuthError(f"GitHub OAuth error: {data['error_description']}")
                
            return data["access_token"]
        except Exception as e:
            raise GitHubAuthError(f"Failed to exchange code for token: {str(e)}")
    
    def get_user_info(self, access_token: str) -> GitHubUser:
        """
        Get GitHub user information using access token.
        
        Args:
            access_token: GitHub OAuth access token
            
        Returns:
            GitHubUser object with user information
            
        Raises:
            GitHubAuthError: If user info retrieval fails
        """
        try:
            github = Github(access_token)
            user = github.get_user()
            
            return GitHubUser(
                username=user.login,
                name=user.name,
                email=user.email,
                avatar_url=user.avatar_url,
                access_token=access_token,
            )
        except Exception as e:
            raise GitHubAuthError(f"Failed to get user info: {str(e)}")
    
    def create_pages_repository(
        self, 
        access_token: str, 
        template_path: Path
    ) -> str:
        """
        Create a GitHub Pages repository for the user.
        
        Args:
            access_token: GitHub OAuth access token
            template_path: Path to the Hugo template to use
            
        Returns:
            URL of the created GitHub Pages site
            
        Raises:
            GitHubRepoError: If repository creation fails
        """
        try:
            github = Github(access_token)
            user = github.get_user()
            repo_name = f"{user.login}.github.io"
            
            # Check if repo already exists
            try:
                repo = user.get_repo(repo_name)
                # If we get here, repo exists
                return f"https://{repo_name}"
            except GithubException:
                # Repo doesn't exist, create it
                repo = user.create_repo(
                    name=repo_name,
                    description=f"Personal portfolio site for {user.name or user.login}",
                    homepage=f"https://{repo_name}",
                    has_issues=False,
                    has_wiki=False,
                    auto_init=True,
                )
            
            # Push template files to the repository
            self._push_template_to_repo(repo, user, template_path)
            
            return f"https://{repo_name}"
        except Exception as e:
            raise GitHubRepoError(f"Failed to create Pages repository: {str(e)}")
    
    def _push_template_to_repo(
        self,
        repo: Repository.Repository,
        user: AuthenticatedUser.AuthenticatedUser,
        template_path: Path
    ) -> None:
        """
        Push template files to the GitHub repository.
        
        Args:
            repo: GitHub repository object
            user: GitHub user object
            template_path: Path to the Hugo template
            
        Raises:
            GitHubRepoError: If pushing template fails
        """
        try:
            # This would be implemented with PyGithub's file operations
            # For now, this is a placeholder for the actual implementation
            # In a real implementation, we would:
            # 1. Clone the repo to a temp directory
            # 2. Copy template files to the temp directory
            # 3. Commit and push changes
            
            # Placeholder for actual implementation
            pass
        except Exception as e:
            raise GitHubRepoError(f"Failed to push template to repository: {str(e)}")
    
    def update_repository_content(
        self,
        access_token: str,
        repo_name: str,
        content_files: Dict[str, str]
    ) -> bool:
        """
        Update content files in an existing repository.
        
        Args:
            access_token: GitHub OAuth access token
            repo_name: Name of the repository to update
            content_files: Dictionary mapping file paths to content
            
        Returns:
            True if update was successful
            
        Raises:
            GitHubRepoError: If repository update fails
        """
        try:
            github = Github(access_token)
            user = github.get_user()
            repo = user.get_repo(repo_name)
            
            # Update each file in the repository
            for file_path, content in content_files.items():
                try:
                    # Check if file exists
                    file_content = repo.get_contents(file_path)
                    # Update existing file
                    repo.update_file(
                        path=file_path,
                        message=f"Update {file_path}",
                        content=content,
                        sha=file_content.sha,
                    )
                except GithubException:
                    # File doesn't exist, create it
                    repo.create_file(
                        path=file_path,
                        message=f"Create {file_path}",
                        content=content,
                    )
            
            return True
        except Exception as e:
            raise GitHubRepoError(f"Failed to update repository content: {str(e)}")
    
    def get_pages_build_status(self, access_token: str, repo_name: str) -> Dict[str, Any]:
        """
        Get the status of GitHub Pages build.
        
        Args:
            access_token: GitHub OAuth access token
            repo_name: Name of the repository
            
        Returns:
            Dictionary with build status information
            
        Raises:
            GitHubRepoError: If status retrieval fails
        """
        try:
            # This would use the GitHub API to check Pages build status
            # For now, return a placeholder
            return {
                "status": "building",
                "url": f"https://{repo_name}",
            }
        except Exception as e:
            raise GitHubRepoError(f"Failed to get Pages build status: {str(e)}")
