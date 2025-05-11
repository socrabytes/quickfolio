"""
Hugo Generator Utilities

This module provides utilities for generating Hugo site content
from resume data and AI-generated content.
"""
import os
import json
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
    
    # Copy theme files - ensure we preserve permissions and file attributes
    print(f"Copying theme from {theme_path} to {themes_dir}")
    for item in theme_path.iterdir():
        if item.is_dir():
            # Use shutil.copytree with dirs_exist_ok=True to preserve file permissions
            target_dir = themes_dir / item.name
            print(f"Copying directory {item} to {target_dir}")
            # Ensure target directory exists
            target_dir.mkdir(parents=True, exist_ok=True)
            # Copy all files within directory
            for sub_item in item.glob('**/*'):
                if sub_item.is_file():
                    rel_path = sub_item.relative_to(item)
                    target_file = target_dir / rel_path
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(sub_item, target_file)
        else:
            print(f"Copying file {item} to {themes_dir / item.name}")
            shutil.copy2(item, themes_dir / item.name)
    
    # Verify key theme files exist
    layouts_dir = themes_dir / "layouts"
    if not (layouts_dir / "_default" / "baseof.html").exists():
        raise HugoGenerationError(f"Theme missing crucial layout file: layouts/_default/baseof.html")
    
    print(f"Theme copied successfully to {themes_dir}")
    
    # Also copy layouts to site root layouts for Hugo 0.42+ compatibility
    site_layouts = output_path / "layouts"
    if layouts_dir.exists() and layouts_dir.is_dir():
        site_layouts.mkdir(exist_ok=True)
        # Copy layout files from theme to site root
        for layout_file in layouts_dir.glob('**/*'):
            if layout_file.is_file():
                rel_path = layout_file.relative_to(layouts_dir)
                target_file = site_layouts / rel_path
                target_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(layout_file, target_file)


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
    
    # Create data directory for Hugo data files
    data_dir = output_path / "data"
    data_dir.mkdir(exist_ok=True)
    
    # Create a data file with resume and generated content
    # This allows Hugo to access this data through the .Site.Data variable
    data_file = data_dir / "portfolio.json"
    
    # Combine resume and generated content into a data structure
    portfolio_data = {
        "resume": resume_data,
        "content": generated_content,
        **template_vars  # Include flattened variables for convenience
    }
    
    # Write data file
    with open(data_file, "w") as f:
        json.dump(portfolio_data, f, indent=2)
    
    # Process Markdown content files
    content_dir = output_path / "content"
    print(f"Processing content files in {content_dir}")
    for root, _, files in os.walk(content_dir):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                print(f"Processing content file: {file_path}")
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
    # Only process content files (.md), not Hugo templates
    if not str(file_path).endswith('.md'):
        return
        
    with open(file_path, "r") as f:
        content = f.read()
    
    # Only replace content variables, not Hugo template variables
    # This ensures Hugo's template system stays intact
    
    # Front matter needs special handling - don't replace variables in front matter section
    front_matter_end = content.find('---', 3)  # Skip first '---'
    if front_matter_end > 0:
        front_matter = content[:front_matter_end + 3]
        main_content = content[front_matter_end + 3:]
        
        # Replace date in front matter with actual date
        if '{{ .Date }}' in front_matter:
            front_matter = front_matter.replace('{{ .Date }}', template_vars.get('Date', ''))
            
        # Replace variables in main content (after front matter)
        for key, value in template_vars.items():
            if isinstance(value, str):
                # Note: We're only replacing content variables, not template variables
                # This keeps Hugo's template structure intact
                placeholder = f'{{{{ .{key} }}}}'
                if placeholder in main_content:
                    main_content = main_content.replace(placeholder, value)
        
        # Combine processed parts
        content = front_matter + main_content
    else:
        # If no front matter, just replace content variables
        for key, value in template_vars.items():
            if isinstance(value, str):
                content = content.replace(f'{{{{ .{key} }}}}', value)
    
    # Write updated content
    with open(file_path, "w") as f:
        f.write(content)
    
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
        
    # Get user info for configuration
    contact = resume_data.get("contact", {})
    name = contact.get("name", "Professional Portfolio")
    github_username = ""
    
    # Extract GitHub username from URL if available
    github_url = contact.get("github", "")
    if github_url:
        github_username = github_url.split("/")[-1] if "/" in github_url else github_url
        
    # Update baseURL with GitHub username if available
    if github_username:
        config_content = config_content.replace(
            'baseURL = "https://extractedname.github.io/"',
            f'baseURL = "https://{github_username}.github.io/"'
        )
        
    # Update site title with user's name
    config_content = config_content.replace(
        'title = "Extracted Name\'s Portfolio"',
        f'title = "{name}\'s Portfolio"'
    )
    
    # Update theme setting
    config_content = config_content.replace(
        'theme = "minimal"',
        f'theme = "{theme}"'
    )
    
    # Write updated config
    with open(config_path, "w") as f:
        f.write(config_content)
