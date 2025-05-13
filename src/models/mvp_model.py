from typing import List, Optional, Any
from pydantic import BaseModel, AnyUrl, field_validator

class ProfileData(BaseModel):
    """Profile data for the link-in-bio page"""
    name: str
    headline: str
    avatar: str # e.g., "avatar.jpg" - user provides file, AI suggests filename

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
