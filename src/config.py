"""
Configuration module for Quickfolio application.

Loads environment variables and provides configuration settings
for different components of the application.
"""
import os
from pathlib import Path
from typing import Dict, Optional, Union

from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).parent.parent
SRC_DIR = BASE_DIR / "src"
TEMPLATES_DIR = SRC_DIR / "hugo" / "base_template"
THEMES_DIR = SRC_DIR / "hugo" / "themes"

# Load environment variables
env_path = BASE_DIR / ".env" # Load .env from project root
load_dotenv(dotenv_path=env_path)

# Gemini AI Configuration
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-pro")
GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "500"))
GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))

# GitHub Configuration
GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_CALLBACK_URL: str = os.getenv("GITHUB_CALLBACK_URL", "http://localhost:8000/callback")

# Application Settings
DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
PORT: int = int(os.getenv("PORT", "8000"))
HOST: str = os.getenv("HOST", "0.0.0.0")

# Content Generation Settings
MAX_PDF_SIZE_MB: int = int(os.getenv("MAX_PDF_SIZE_MB", "10"))
CACHE_EXPIRY_SECONDS: int = int(os.getenv("CACHE_EXPIRY_SECONDS", "3600"))

# Hugo Themes
AVAILABLE_THEMES: Dict[str, Dict[str, str]] = {
    "minimal": {
        "name": "Minimal",
        "description": "Clean, simple design focusing on content",
        "preview_image": "minimal.png",
    },
    "professional": {
        "name": "Professional",
        "description": "Polished design for corporate and business portfolios",
        "preview_image": "professional.png",
    },
    "creative": {
        "name": "Creative",
        "description": "Bold, colorful design for creative professionals",
        "preview_image": "creative.png",
    },
}

def get_theme_path(theme_id: str) -> Optional[Path]:
    """Get the filesystem path for a theme by its ID."""
    if theme_id in AVAILABLE_THEMES:
        return THEMES_DIR / theme_id
    return None
