"""
Hugo Generator Utilities

This module provides utilities for generating Hugo site content
from resume data and AI-generated content.
"""
import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from src.config import TEMPLATES_DIR, THEMES_DIR


class HugoGenerationError(Exception):
    """Exception raised when Hugo site generation fails."""
    pass


def create_site_from_template(
    output_path: Path,
    theme: str,
    resume_data: Dict[str, Any],
    generated_content: Dict[str, Any]
) -> Path:
    """
    Create a Hugo site from template with resume data and generated content.
    
    Args:
        output_path: Path where the site will be generated
        theme: Theme to use for the site
        resume_data: Resume data dictionary
        generated_content: Generated content dictionary
        
    Returns:
        Path to the generated site
        
    Raises:
        HugoGenerationError: If site generation fails
    """
    try:
        # Create output directory if it doesn't exist
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Copy base template to output directory
        copy_template_to_output(output_path)
        
        # Copy theme to output directory
        copy_theme_to_output(output_path, theme)
        
        # Generate content files
        generate_content_files(output_path, resume_data, generated_content)
        
        # Update config.toml with user data
        update_config(output_path, resume_data, theme)
        
        return output_path
    except Exception as e:
        raise HugoGenerationError(f"Failed to generate Hugo site: {str(e)}")


def copy_template_to_output(output_path: Path) -> None:
    """
    Copy base template to output directory.
    
    Args:
        output_path: Path where the site will be generated
    """
    for item in TEMPLATES_DIR.iterdir():
        if item.is_dir():
            shutil.copytree(item, output_path / item.name, dirs_exist_ok=True)
        else:
            shutil.copy2(item, output_path / item.name)


def copy_theme_to_output(output_path: Path, theme: str) -> None:
    """
    Copy theme to output directory.
    
    Args:
        output_path: Path where the site will be generated
        theme: Theme to use for the site
    """
    theme_path = THEMES_DIR / theme
    if not theme_path.exists():
        raise HugoGenerationError(f"Theme '{theme}' not found")
    
    # Create themes directory if it doesn't exist
    themes_dir = output_path / "themes" / theme
    themes_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy theme files
    for item in theme_path.iterdir():
        if item.is_dir():
            shutil.copytree(item, themes_dir / item.name, dirs_exist_ok=True)
        else:
            shutil.copy2(item, themes_dir / item.name)


def generate_content_files(
    output_path: Path,
    resume_data: Dict[str, Any],
    generated_content: Dict[str, Any]
) -> None:
    """
    Generate content files from resume data and generated content.
    
    Args:
        output_path: Path where the site will be generated
        resume_data: Resume data dictionary
        generated_content: Generated content dictionary
    """
    # Prepare template variables
    template_vars = prepare_template_variables(resume_data, generated_content)
    
    # Process content files
    content_dir = output_path / "content"
    for root, _, files in os.walk(content_dir):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                process_template_file(file_path, template_vars)


def prepare_template_variables(
    resume_data: Dict[str, Any],
    generated_content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Prepare template variables from resume data and generated content.
    
    Args:
        resume_data: Resume data dictionary
        generated_content: Generated content dictionary
        
    Returns:
        Dictionary of template variables
    """
    contact = resume_data.get("contact", {})
    
    return {
        "Name": contact.get("name", ""),
        "Email": contact.get("email", ""),
        "Phone": contact.get("phone", ""),
        "Location": contact.get("location", ""),
        "Website": contact.get("website", ""),
        "LinkedIn": contact.get("linkedin", ""),
        "GitHub": contact.get("github", ""),
        "Bio": generated_content.get("bio", ""),
        "SkillsSummary": generated_content.get("skills_summary", ""),
        "Date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S-07:00"),
        "Description": generated_content.get("meta_description", ""),
        "Experience": resume_data.get("experience", []),
        "Education": resume_data.get("education", []),
        "Projects": resume_data.get("projects", []),
        "Skills": resume_data.get("skills", []),
        "Languages": resume_data.get("languages", []),
        "Certifications": resume_data.get("certifications", []),
        "ProjectDescriptions": generated_content.get("project_descriptions", {}),
    }


def process_template_file(file_path: Path, template_vars: Dict[str, Any]) -> None:
    """
    Process a template file by replacing template variables.
    
    Args:
        file_path: Path to the template file
        template_vars: Dictionary of template variables
    """
    with open(file_path, "r") as f:
        content = f.read()
    
    # Replace template variables
    for key, value in template_vars.items():
        if isinstance(value, str):
            content = content.replace(f"{{{{ .{key} }}}}", value)
    
    # Write updated content
    with open(file_path, "w") as f:
        f.write(content)


def update_config(output_path: Path, resume_data: Dict[str, Any], theme: str) -> None:
    """
    Update Hugo config.toml with user data.
    
    Args:
        output_path: Path where the site will be generated
        resume_data: Resume data dictionary
        theme: Theme to use for the site
    """
    config_path = output_path / "config.toml"
    if not config_path.exists():
        raise HugoGenerationError("config.toml not found in template")
    
    with open(config_path, "r") as f:
        config_content = f.read()
    
    # Get contact info
    contact = resume_data.get("contact", {})
    name = contact.get("name", "")
    
    # Update config
    config_content = config_content.replace("title = \"My Portfolio\"", f"title = \"{name}'s Portfolio\"")
    config_content = config_content.replace("theme = \"minimal\"", f"theme = \"{theme}\"")
    config_content = config_content.replace("baseURL = \"https://username.github.io/\"", f"baseURL = \"https://{name.lower().replace(' ', '')}.github.io/\"")
    
    # Write updated config
    with open(config_path, "w") as f:
        f.write(config_content)
