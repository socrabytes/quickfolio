"""
GitHub Repository Service

This module handles GitHub App authentication and repository operations
for creating and managing portfolio sites on GitHub Pages.
"""
from dataclasses import dataclass
import os
from pathlib import Path
import tempfile
from typing import Dict, List, Optional, Tuple, Any
import time
import jwt
from datetime import datetime

import requests
from github import Github, GithubException, Auth as GithubAuth

from src.config import (
    GITHUB_APP_ID,
    GITHUB_APP_CLIENT_ID,
    GITHUB_APP_CLIENT_SECRET,
    GITHUB_APP_PRIVATE_KEY_PATH,
    GITHUB_APP_INSTALLATION_CALLBACK_URL,
    GITHUB_APP_NAME,
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
    id: int
    login: str
    name: Optional[str]
    email: Optional[str]
    avatar_url: Optional[str]


class GitHubService:
    """
    Service for GitHub App authentication and repository operations.
    
    This class handles GitHub App authentication flow (including user OAuth part)
    and repository creation/management for GitHub Pages deployment.
    """
    
    def __init__(self) -> None:
        """Initialize the GitHub service with App configuration."""
        self.app_id = GITHUB_APP_ID
        self.client_id = GITHUB_APP_CLIENT_ID 
        self.client_secret = GITHUB_APP_CLIENT_SECRET 
        self.installation_callback_url = GITHUB_APP_INSTALLATION_CALLBACK_URL
        self.app_name = GITHUB_APP_NAME # Should be the URL-slugified name of your GitHub App

        if not self.app_id:
            raise ValueError("GITHUB_APP_ID is not set in .env file")
        if not self.client_id:
            raise ValueError("GITHUB_APP_CLIENT_ID is not set in .env file")
        if not self.client_secret:
            raise ValueError("GITHUB_APP_CLIENT_SECRET is not set in .env file")
        if not GITHUB_APP_PRIVATE_KEY_PATH:
            raise ValueError("GITHUB_APP_PRIVATE_KEY_PATH is not set in .env file")

        key_file_path_str = GITHUB_APP_PRIVATE_KEY_PATH
        
        project_root = Path(__file__).resolve().parent.parent.parent
        if os.path.isabs(key_file_path_str):
            key_file_path = Path(key_file_path_str)
        else:
            key_file_path = project_root / key_file_path_str
            
        try:
            with open(key_file_path, 'r') as key_file:
                self.private_key = key_file.read()
        except FileNotFoundError:
            raise FileNotFoundError(
                f"GitHub App private key not found at {key_file_path}. "
                f"Ensure GITHUB_APP_PRIVATE_KEY_PATH in .env ('{GITHUB_APP_PRIVATE_KEY_PATH}') is correct relative to project root ('{project_root}') or as an absolute path."
            )
        except Exception as e:
            raise ValueError(f"Error loading GitHub App private key: {e}")

        if not self.private_key:
            raise ValueError("GITHUB_APP_PRIVATE_KEY could not be loaded.")

    def _generate_app_jwt(self) -> str:
        """
        Generate a JSON Web Token (JWT) to authenticate as the GitHub App.
        This token is short-lived (max 10 minutes).
        """
        payload = {
            "iat": int(time.time()) - 60,  # Issued at time (60 seconds in the past to allow for clock drift)
            "exp": int(time.time()) + (10 * 60) - 60,  # Expiration time (10 minutes from now, less 60s buffer)
            "iss": self.app_id  # Issuer: your GitHub App's ID
        }
        
        try:
            token = jwt.encode(
                payload,
                self.private_key,
                algorithm="RS256"
            )
            return token
        except Exception as e:
            # Consider using proper logging
            print(f"ERROR:_generate_app_jwt: {str(e)}") 
            raise GitHubAuthError(f"Failed to generate GitHub App JWT: {str(e)}")

    def get_installation_access_token(self, installation_id: int) -> Tuple[str, datetime]:
        """
        Get an installation access token for a specific installation_id.
        
        Args:
            installation_id: The ID of the app installation.
            
        Returns:
            A tuple containing the installation access token (str) and its expiry time (datetime).
            
        Raises:
            GitHubAuthError: If token retrieval fails.
        """
        app_jwt = self._generate_app_jwt()
        
        headers = {
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        token_url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
        
        try:
            response = requests.post(token_url, headers=headers)
            response.raise_for_status() 
            data = response.json()
            
            if "token" not in data or "expires_at" not in data:
                raise GitHubAuthError("Invalid response when fetching installation token: 'token' or 'expires_at' missing.")

            expires_at_str = data["expires_at"]
            if expires_at_str.endswith('Z'):
                 expires_at_str = expires_at_str[:-1] + "+00:00"
            
            expires_at_dt = datetime.fromisoformat(expires_at_str)

            return data["token"], expires_at_dt
        except requests.exceptions.RequestException as e:
            error_details = str(e)
            if e.response is not None:
                try:
                    error_details = f"{e.response.status_code} - {e.response.json()}"
                except ValueError: 
                    error_details = f"{e.response.status_code} - {e.response.text}"
            print(f"ERROR:get_installation_access_token:RequestException: {error_details} for URL: {token_url}")
            raise GitHubAuthError(f"Failed to get installation access token for installation {installation_id}: {error_details}")
        except Exception as e: 
             print(f"ERROR:get_installation_access_token:Exception: {str(e)}")
             raise GitHubAuthError(f"An unexpected error occurred while getting installation access token: {str(e)}")

    def get_github_app_installation_url(self, state: Optional[str] = None) -> str:
        """
        Get the URL to redirect the user to install the GitHub App.

        Args:
            state: An optional unguessable random string to protect against CSRF attacks.
        
        Returns:
            URL string for GitHub App installation.
        """
        # self.app_name should be the URL-slugified name of the GitHub App.
        # e.g., if GitHub App name is "My Quickfolio App", GITHUB_APP_NAME in .env should be "my-quickfolio-app"
        base_url = f"https://github.com/apps/{self.app_name}/installations/new"
        
        params = {}
        if state:
            params["state"] = state
            
        if params:
            import urllib.parse
            return f"{base_url}?{urllib.parse.urlencode(params)}"
        return base_url

    def get_oauth_url(self) -> str:
        """
        Get the GitHub OAuth authorization URL.
        
        Returns:
            URL to redirect the user for GitHub authorization
        """
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={self.client_id}"
            f"&redirect_uri={self.installation_callback_url}"
            f"&scope=public_repo,user:email"
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
                    "redirect_uri": self.installation_callback_url,
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
                id=user.id,
                login=user.login,
                name=user.name,
                email=user.email,
                avatar_url=user.avatar_url,
            )
        except Exception as e:
            raise GitHubAuthError(f"Failed to get user info: {str(e)}")
    
    def create_pages_repository(
        self, 
        installation_access_token: str, 
        user_login: str, # The login of the user for whom to create the repo
        repo_name: str, # Just the repo name, e.g., "my-portfolio"
        template_path: Path,
        description: str = "My Quickfolio-generated portfolio site",
        private: bool = False
    ) -> Tuple[str, str]: # Returns (repo_html_url, pages_url)
        """
        Create a GitHub Pages repository for the user using an installation token.
        
        Args:
            installation_access_token: GitHub App installation access token.
            user_login: The GitHub login of the user for whom the repo is created.
            repo_name: The desired name for the new repository (e.g., "my-portfolio").
            template_path: Path to the site template to use.
            description: Description for the new repository.
            private: Whether the repository should be private.
            
        Returns:
            A tuple containing the HTML URL of the created repository 
            and the anticipated GitHub Pages URL.
            
        Raises:
            GitHubRepoError: If repository creation or setup fails.
        """
        try:
            g = Github(auth=GithubAuth.Token(installation_access_token))
            
            # For creating a repo in a user's account using an installation token
            # that was installed on that user's account, we get the authenticated user
            # context, which allows creating repos for that user.
            authenticated_entity = g.get_user()

            # Check if repo already exists under the user's account
            try:
                repo_to_check_full_name = f"{user_login}/{repo_name}"
                g.get_repo(repo_to_check_full_name)
                # If get_repo didn't raise an exception, the repo exists.
                raise GitHubRepoError(f"Repository '{repo_to_check_full_name}' already exists.")
            except GithubException as e:
                if e.status == 404:
                    # This is expected if the repo doesn't exist, so we can proceed.
                    pass 
                else:
                    # Some other error occurred while checking repo existence.
                    error_msg = e.data.get('message', str(e)) if hasattr(e, 'data') and e.data else str(e)
                    print(f"ERROR:create_pages_repository:Checking existence for {user_login}/{repo_name}: {error_msg}")
                    raise GitHubRepoError(f"Error checking if repository '{user_login}/{repo_name}' exists: {error_msg}")

            # Create the new repository
            # The 'name' parameter is just the short name for the repo.
            new_repo = authenticated_entity.create_repo(
                name=repo_name,
                description=description,
                private=private,
                auto_init=True # Initialize with a README
            )
            print(f"Repository '{new_repo.full_name}' created successfully.")

            # Call _push_template_to_repo with new required arguments
            # Note: _push_template_to_repo itself will be refactored in the next step
            self._push_template_to_repo(
                installation_access_token=installation_access_token, # New arg for _push_template_to_repo
                owner_login=new_repo.owner.login, # New arg for _push_template_to_repo
                repo=new_repo, 
                template_path=template_path
            )
            
            # GitHub Pages setup will primarily be handled by a workflow file in the template.
            # The URL is predictable.
            pages_url = f"https://{new_repo.owner.login}.github.io/{new_repo.name}/"
            print(f"GitHub Pages site expected at: {pages_url}")
            
            return new_repo.html_url, pages_url
            
        except GithubException as e:
            error_message = e.data.get("message", str(e)) if hasattr(e, 'data') and e.data else str(e)
            if hasattr(e, 'data') and e.data and e.data.get("errors"):
                error_message += f" Details: {e.data.get('errors')}"
            print(f"ERROR:create_pages_repository:GithubException: {error_message}")
            raise GitHubRepoError(f"Failed to create GitHub Pages repository '{user_login}/{repo_name}': {error_message}")
        except Exception as e:
            print(f"ERROR:create_pages_repository:Exception: {str(e)}")
            # Consider logging the full traceback here for better diagnostics
            # import traceback
            # print(traceback.format_exc())
            raise GitHubRepoError(f"An unexpected error occurred while creating repository '{user_login}/{repo_name}': {str(e)}")

    def _push_template_to_repo(
        self,
        installation_access_token: str,
        owner_login: str,
        repo: Github.Repository.Repository,
        template_path: Path
    ) -> None:
        """
        Push template files to the GitHub repository using installation token.
        
        Args:
            installation_access_token: GitHub App installation access token.
            owner_login: The GitHub login of the repository owner.
            repo: GitHub repository object.
            template_path: Path to the site template.
            
        Raises:
            GitHubRepoError: If pushing template fails.
        """
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                import git # Ensure GitPython is imported
                
                # Use installation token for Git authentication
                # The 'x-access-token' user is conventional for tokens when using a token directly in the URL
                repo_url = f"https://x-access-token:{installation_access_token}@github.com/{owner_login}/{repo.name}.git"
                
                # Clone the specific default branch
                local_repo = git.Repo.clone_from(repo_url, temp_dir, branch=repo.default_branch)
                print(f"Cloned {repo.full_name} (branch: {repo.default_branch}) into temporary directory {temp_dir}")
                
                # Copy template files to the temp directory
                import shutil
                files_copied_count = 0
                for item in template_path.iterdir(): # iterdir() for direct children
                    dest_path = Path(temp_dir) / item.name
                    if item.is_dir():
                        # Ensure destination doesn't exist if it's a directory to avoid issues with copytree
                        if dest_path.exists() and dest_path.is_dir():
                            shutil.rmtree(dest_path)
                        shutil.copytree(item, dest_path, dirs_exist_ok=False) # dirs_exist_ok=False is safer
                    else:
                        if dest_path.exists() and dest_path.is_dir(): # prevent overwriting a dir with a file
                             shutil.rmtree(dest_path)
                        shutil.copy2(item, dest_path)
                    files_copied_count += 1
                
                if files_copied_count == 0:
                    print(f"Warning: No files found in template_path: {template_path}")
                    # For now, proceed even if template is empty, repo is already created.

                # Add all files to git
                local_repo.git.add(A=True)
                
                # Check if there are changes to commit
                # (untracked_files=True includes new files from the template)
                if local_repo.is_dirty(untracked_files=True):
                    commit_message = "✨ feat: Initial portfolio setup from template"
                    local_repo.index.commit(commit_message) # Use index.commit for cleaner commits
                    print(f"Committed changes to local repository: {commit_message}")

                    # Push changes to the default branch
                    origin = local_repo.remote(name='origin')
                    # Ensure we are pushing to the same branch we cloned
                    origin.push(refspec=f"{repo.default_branch}:{repo.default_branch}")
                    print(f"Pushed template content to {repo.full_name} on branch {repo.default_branch}")
                else:
                    print(f"No changes to commit to {repo.full_name} from template (template might be empty or match initial repo state).")
                
        except git.exc.GitCommandError as e:
            # Log stderr for more details if available
            stderr_output = e.stderr if hasattr(e, 'stderr') else str(e)
            print(f"ERROR:_push_template_to_repo:GitCommandError: {stderr_output}")
            # Provide more context in the raised error
            raise GitHubRepoError(f"Git command failed for '{repo.full_name}' (branch: {repo.default_branch}): {stderr_output}")
        except Exception as e:
            print(f"ERROR:_push_template_to_repo:Exception for {repo.full_name}: {str(e)}")
            # import traceback # For debugging, uncomment to see full stack trace
            # print(traceback.format_exc())
            raise GitHubRepoError(f"Failed to push template to repository '{repo.full_name}': {str(e)}")

    def update_repository_content(
        self,
        installation_access_token: str, # Changed from access_token
        full_repo_name: str,          # Changed from repo_name, expects "owner/repo"
        content_files: Dict[str, str], # file_path (in repo) -> content (str)
        commit_message_prefix: str = "📝 chore: Update"
    ) -> bool:
        """
        Update content files in an existing repository using an installation token.
        
        Args:
            installation_access_token: GitHub App installation access token.
            full_repo_name: Full name of the repository (e.g., "owner/repo").
            content_files: Dictionary mapping file paths in repo to their new string content.
            commit_message_prefix: Prefix for commit messages.
            
        Returns:
            True if update was successful.
            
        Raises:
            GitHubRepoError: If repository update fails.
        """
        try:
            g = Github(auth=GithubAuth.Token(installation_access_token))
            repo = g.get_repo(full_repo_name) 
            
            default_branch_name = repo.default_branch
            ref_str = f"refs/heads/{default_branch_name}"
            git_ref = repo.get_git_ref(ref_str)
            latest_commit_sha = git_ref.object.sha
            
            tree_elements = []

            for file_path, content_str in content_files.items():
                # Ensure content is bytes for blob creation if PyGithub expects it, or handle encoding correctly.
                # PyGithub's create_git_blob typically handles string content with utf-8 encoding.
                blob_sha = repo.create_git_blob(content_str, "utf-8").sha
                tree_elements.append(
                    Github.InputGitTreeElement(
                        path=file_path,
                        mode='100644', # blob (file)
                        type='blob',
                        sha=blob_sha
                    )
                )
            
            if not tree_elements:
                print(f"No content provided to update for repository {full_repo_name}.")
                # Depending on desired behavior, could return True or False, or raise error.
                # For now, returning False as no action was taken.
                return False

            # Get the tree of the latest commit on the default branch
            base_tree_sha = repo.get_commit(sha=latest_commit_sha).commit.tree.sha
            base_tree = repo.get_git_tree(sha=base_tree_sha) # Fetch the base tree to build upon

            # Create a new tree with the new/updated file blobs
            # Note: This approach replaces files if they exist at the specified paths,
            # or adds them if they don't. It doesn't automatically handle recursive tree structures
            # for file paths like 'dir/file.txt' unless base_tree is used carefully or paths are simple.
            # For simplicity, assuming flat paths or that create_git_tree handles them based on base_tree.
            # A more robust solution for deep paths might involve creating trees for subdirectories.
            new_tree = repo.create_git_tree(tree_elements, base_tree=base_tree) 
            
            # Create a new commit
            commit_message = f"{commit_message_prefix} content in {', '.join(content_files.keys())} by Quickfolio App"
            if len(commit_message) > 150: # Keep commit message somewhat concise
                commit_message = f"{commit_message_prefix} content by Quickfolio App"
            
            new_commit = repo.create_git_commit(
                message=commit_message,
                tree=new_tree,
                parents=[repo.get_git_commit(latest_commit_sha)] # Parent is the latest commit
            )
            
            # Update the branch reference (e.g., refs/heads/main) to point to the new commit
            git_ref.edit(sha=new_commit.sha)
            
            print(f"Successfully updated content in {full_repo_name} (branch: {default_branch_name}) with commit: {new_commit.sha}")
            return True

        except GithubException as e:
            error_message = e.data.get("message", str(e)) if hasattr(e, 'data') and e.data else str(e)
            if hasattr(e, 'data') and e.data and e.data.get("errors"):
                error_message += f" Details: {e.data.get('errors')}"
            print(f"ERROR:update_repository_content:GithubException for {full_repo_name}: {error_message}")
            raise GitHubRepoError(f"Failed to update repository content for '{full_repo_name}': {error_message}")
        except Exception as e:
            print(f"ERROR:update_repository_content:Exception for {full_repo_name}: {str(e)}")
            # import traceback
            # print(traceback.format_exc())
            raise GitHubRepoError(f"An unexpected error occurred while updating repository '{full_repo_name}': {str(e)}")
    
    def get_pages_build_status(self, installation_access_token: str, full_repo_name: str) -> Dict[str, Any]:
        """
        Get the status of GitHub Pages build using an installation token.
        
        Args:
            installation_access_token: GitHub App installation access token.
            full_repo_name: Full name of the repository (e.g., "owner/repo").
            
        Returns:
            Dictionary with build status information.
            
        Raises:
            GitHubRepoError: If status retrieval fails.
        """
        try:
            g = Github(auth=GithubAuth.Token(installation_access_token))
            repo = g.get_repo(full_repo_name)
            
            # Get Pages site information
            pages_info = repo.get_pages() # PyGithub method for getting site info
            
            # Get latest Pages build (if available)
            latest_build = None
            # repo.get_pages_builds() returns a PaginatedList of PagesBuild objects
            builds_iterator = repo.get_pages_builds()
            if builds_iterator.totalCount > 0:
                # The list is typically ordered with the latest build first
                latest_build = builds_iterator[0] 
            
            status_payload = {
                "status": latest_build.status if latest_build else pages_info.status, 
                "url": pages_info.html_url, # This is the settings URL, pages_info.url is the live site URL
                "live_url": pages_info.url if hasattr(pages_info, 'url') else (f"https://{repo.owner.login}.github.io/{repo.name}/" if pages_info.status else None),
                "cname": pages_info.cname,
                "source": pages_info.source.raw_data if pages_info.source else None, # branch, path
                "last_build_duration": latest_build.duration if latest_build else None,
                "last_build_commit_sha": latest_build.commit if latest_build else None,
                "last_build_error": latest_build.error.get("message") if latest_build and latest_build.error else None,
                "protected_domain_state": pages_info.protected_domain_state if hasattr(pages_info, 'protected_domain_state') else None,
                "pending_domain": pages_info.pending_domain if hasattr(pages_info, 'pending_domain') else None,
            }
            return status_payload

        except GithubException as e:
            if e.status == 404: # Pages site not found or not enabled for this repo
                 return {
                    "status": "not_found",
                    "url": None,
                    "live_url": None,
                    "message": f"GitHub Pages site not found or not enabled for {full_repo_name}."
                }
            error_message = e.data.get("message", str(e)) if hasattr(e, 'data') and e.data else str(e)
            print(f"ERROR:get_pages_build_status:GithubException for {full_repo_name}: {error_message}")
            raise GitHubRepoError(f"Failed to get Pages build status for '{full_repo_name}': {error_message}")
        except Exception as e:
            print(f"ERROR:get_pages_build_status:Exception for {full_repo_name}: {str(e)}")
            # import traceback
            # print(traceback.format_exc())
            raise GitHubRepoError(f"An unexpected error occurred while getting Pages build status for '{full_repo_name}': {str(e)}")

# End of GitHubService class modifications
