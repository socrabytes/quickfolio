"""
PDF Resume Parser

This module extracts structured data from PDF resumes using pdfplumber.
It converts unstructured resume content into a standardized JSON format
that can be used for portfolio generation.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Union, Any

import pdfplumber
from pydantic import BaseModel


class ContactInfo(BaseModel):
    """Contact information from a resume."""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


class Education(BaseModel):
    """Educational background from a resume."""
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None
    description: Optional[str] = None


class Experience(BaseModel):
    """Work experience from a resume."""
    company: str
    position: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    achievements: List[str] = field(default_factory=list)


class Project(BaseModel):
    """Project information from a resume."""
    name: str
    description: Optional[str] = None
    technologies: List[str] = field(default_factory=list)
    url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Skill(BaseModel):
    """Skill information from a resume."""
    name: str
    category: Optional[str] = None
    level: Optional[str] = None


class ResumeData(BaseModel):
    """Structured resume data extracted from a PDF."""
    contact: ContactInfo
    summary: Optional[str] = None
    education: List[Education] = field(default_factory=list)
    experience: List[Experience] = field(default_factory=list)
    projects: List[Project] = field(default_factory=list)
    skills: List[Skill] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)
    languages: List[str] = field(default_factory=list)
    interests: List[str] = field(default_factory=list)


class PDFParseError(Exception):
    """Exception raised when PDF parsing fails."""
    pass


def extract_text_from_pdf(pdf_path: Union[str, Path]) -> str:
    """
    Extract all text content from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        String containing all text from the PDF
        
    Raises:
        PDFParseError: If the PDF cannot be parsed
    """
    try:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise PDFParseError(f"PDF file not found: {pdf_path}")
            
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            
            if not text.strip():
                raise PDFParseError("No text content found in PDF")
                
            return text
    except Exception as e:
        raise PDFParseError(f"Failed to parse PDF: {str(e)}")


def parse_resume_pdf(pdf_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Parse a resume PDF into structured data.
    
    This is the main entry point for the PDF parser. It extracts text
    from the PDF and attempts to identify and structure key resume sections.
    
    Args:
        pdf_path: Path to the PDF resume file
        
    Returns:
        Dictionary containing structured resume data
        
    Raises:
        PDFParseError: If the PDF cannot be parsed
    """
    # Extract raw text from PDF
    text = extract_text_from_pdf(pdf_path)
    
    # Initialize result dictionary
    result = {
        "contact": {
            "name": "",
            "email": "",
            "phone": "",
            "linkedin": "",
            "github": ""
        },
        "summary": "",
        "experience": [],
        "education": [],
        "skills": [],
        "raw_text": text
    }
    
    # Extract name (first line that looks like a name)
    import re
    
    # Try to extract name from the first few lines
    name_match = re.search(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', text, re.MULTILINE)
    if name_match:
        result["contact"]["name"] = name_match.group(1).strip()
    
    # Extract email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        result["contact"]["email"] = email_match.group(0).strip()
    
    # Extract phone number
    phone_match = re.search(r'(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}', text)
    if phone_match:
        result["contact"]["phone"] = phone_match.group(0).strip()
    
    # Extract LinkedIn and GitHub URLs
    linkedin_match = re.search(r'linkedin\.com/in/[a-zA-Z0-9-]+', text, re.IGNORECASE)
    if linkedin_match:
        result["contact"]["linkedin"] = f"https://{linkedin_match.group(0)}"
    
    github_match = re.search(r'github\.com/[a-zA-Z0-9-]+', text, re.IGNORECASE)
    if github_match:
        result["contact"]["github"] = f"https://{github_match.group(0)}"
    
    # Extract skills (simple approach - look for common skills)
    common_skills = [
        'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node\.js', 'TypeScript',
        'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
        'Git', 'REST', 'GraphQL', 'Redux', 'Vue\.js', 'Angular', 'Express'
    ]
    
    found_skills = set()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
            found_skills.add(skill)
    
    result["skills"] = list(found_skills)
    
    # Extract experience (simplified)
    exp_section = re.search(r'(?i)experience.*?(?=\n\n|$)', text, re.DOTALL)
    if exp_section:
        exp_text = exp_section.group(0)
        # Simple extraction of job titles and companies
        jobs = re.findall(r'([A-Z][^\n]+?)\n([A-Z\s&]+?)[\s\n]*\(?([^\n\)]+)\)?', exp_text, re.MULTILINE)
        for title, company, period in jobs:
            result["experience"].append({
                "position": title.strip(),
                "company": company.strip(),
                "period": period.strip()
            })
    
    # Extract education (simplified)
    edu_section = re.search(r'(?i)education.*?(?=\n\n|$)', text, re.DOTALL)
    if edu_section:
        edu_text = edu_section.group(0)
        # Simple extraction of degree and institution
        educations = re.findall(r'([A-Z][^\n]+?)\n([A-Z\s&]+?)[\s\n]*\(?([^\n\)]+)\)?', edu_text, re.MULTILINE)
        for degree, institution, period in educations:
            result["education"].append({
                "degree": degree.strip(),
                "institution": institution.strip(),
                "period": period.strip()
            })
    
    return result


def get_resume_json(pdf_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Process a resume PDF and return structured JSON data.
    
    This is the public API for the parser module.
    
    Args:
        pdf_path: Path to the PDF resume file
        
    Returns:
        Dictionary containing structured resume data
        
    Raises:
        PDFParseError: If the PDF cannot be parsed
    """
    parsed_data = parse_resume_pdf(pdf_path)
    
    # TODO: Add validation and enrichment of parsed data
    
    return parsed_data
