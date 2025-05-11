"""
AI Content Generator

This module uses Google's Gemini AI to enhance resume content for portfolio generation.
It transforms raw resume data into polished, professional content for the portfolio site.
"""
from typing import Dict, List, Optional, Any, Tuple
import uuid

import google.generativeai as genai
from pydantic import BaseModel

from src.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_MAX_TOKENS,
    GEMINI_TEMPERATURE,
)


class GenerationRequest(BaseModel):
    """Request model for content generation."""
    resume_data: Dict[str, Any]
    tone: str = "professional"
    focus_areas: List[str] = []
    max_length: Optional[int] = None


class GenerationResponse(BaseModel):
    """Response model for generated content."""
    bio: str
    project_descriptions: Dict[str, str]
    skills_summary: str
    meta_description: str
    generation_id: str


class ContentGenerator:
    """
    Generates enhanced content from resume data using Google's Gemini AI.
    
    This class handles the transformation of structured resume data
    into polished, professional content for the portfolio site.
    """
    
    def __init__(self) -> None:
        """Initialize the content generator with Gemini API configuration."""
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = GEMINI_MODEL
        self.max_tokens = GEMINI_MAX_TOKENS
        self.temperature = GEMINI_TEMPERATURE
        self.generation_config = {
            "max_output_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": 0.95,
            "top_k": 40,
        }
        
        # Print model information for debugging
        print(f"Using Gemini model: {self.model}")
    
    def generate_bio(self, resume_data: Dict[str, Any], tone: str = "professional") -> str:
        """
        Generate a professional bio from resume data.
        
        Args:
            resume_data: Structured resume data
            tone: Desired tone for the bio (professional, casual, academic)
            
        Returns:
            Generated bio text
        """
        # Extract relevant information for the bio
        name = resume_data.get("contact", {}).get("name", "")
        raw_text = resume_data.get("raw_text", "")
        
        # Create prompt for Gemini
        system_prompt = "You are a professional resume writer specializing in creating compelling personal bios."
        
        user_prompt = f"""
        Create a professional bio for {name} based on their resume information below.
        Use a {tone} tone and focus on their most impressive achievements and skills.
        Keep it concise (2-3 paragraphs) and engaging.
        
        Resume information:
        {raw_text[:2000]}  # Limit text length to avoid token issues
        """
        
        try:
            # Initialize Gemini model
            model = genai.GenerativeModel(
                model_name=self.model,
                generation_config=self.generation_config,
            )
            
            # Create structured prompt with system and user instructions
            prompt_parts = [system_prompt, user_prompt]
            
            # Generate content
            response = model.generate_content(prompt_parts)
            
            # Extract and return the generated bio
            return response.text.strip()
        except Exception as e:
            # Print the exception details for debugging
            print(f"Gemini API Error in generate_bio: {type(e).__name__}: {str(e)}")
            # Fallback to a generic bio if API call fails
            return f"Professional with experience in various fields. Contact: {name}."
    
    def enhance_project_descriptions(
        self, 
        projects: List[Dict[str, Any]],
        tone: str = "professional"
    ) -> Dict[str, str]:
        """
        Enhance project descriptions to be more compelling.
        
        Args:
            projects: List of project data from resume
            tone: Desired tone for the descriptions
            
        Returns:
            Dictionary mapping project names to enhanced descriptions
        """
        enhanced_descriptions = {}
        
        # Create the model once for efficiency
        model = genai.GenerativeModel(
            model_name=self.model,
            generation_config={
                **self.generation_config,
                "max_output_tokens": 150  # Shorter for project descriptions
            },
        )
        
        system_prompt = "You are a technical writer who specializes in compelling project descriptions."
        
        for project in projects:
            name = project.get("name", "")
            description = project.get("description", "")
            technologies = project.get("technologies", [])
            
            if not name or not description:
                continue
                
            tech_str = ", ".join(technologies) if technologies else ""
            
            user_prompt = f"""
            Enhance this project description to be more compelling and achievement-focused.
            Use a {tone} tone and highlight the impact and skills demonstrated.
            
            Project: {name}
            Original Description: {description}
            Technologies: {tech_str}
            """
            
            try:
                # Generate content
                prompt_parts = [system_prompt, user_prompt]
                response = model.generate_content(prompt_parts)
                
                enhanced_descriptions[name] = response.text.strip()
            except Exception as e:
                # Print the exception details for debugging
                print(f"Gemini API Error in enhance_project_descriptions: {type(e).__name__}: {str(e)}")
                # Fallback to original description
                enhanced_descriptions[name] = description
                
        return enhanced_descriptions
    
    def generate_skills_summary(self, skills: List[Dict[str, Any]]) -> str:
        """
        Generate a summary paragraph about the person's skills.
        
        Args:
            skills: List of skills from resume
            
        Returns:
            Generated skills summary paragraph
        """
        if not skills:
            return "Skilled professional with diverse technical abilities."
            
        skill_names = [skill.get("name", "") for skill in skills if skill.get("name")]
        skill_str = ", ".join(skill_names)
        
        system_prompt = "You are a technical recruiter who can summarize skill sets effectively."
        user_prompt = f"""
        Write a concise paragraph (3-4 sentences) summarizing this person's technical skills.
        Group related skills and highlight expertise areas.
        
        Skills: {skill_str}
        """
        
        try:
            # Initialize model
            model = genai.GenerativeModel(
                model_name=self.model,
                generation_config={
                    **self.generation_config,
                    "max_output_tokens": 150
                },
            )
            
            # Generate content
            prompt_parts = [system_prompt, user_prompt]
            response = model.generate_content(prompt_parts)
            
            return response.text.strip()
        except Exception as e:
            # Print the exception details for debugging
            print(f"Gemini API Error in generate_skills_summary: {type(e).__name__}: {str(e)}")
            # Fallback
            return f"Technical expertise includes: {skill_str}."
    
    def generate_all_content(self, request: GenerationRequest) -> GenerationResponse:
        """
        Generate all portfolio content from resume data.
        
        This is the main entry point for content generation.
        
        Args:
            request: Content generation request with resume data and preferences
            
        Returns:
            Generated content for the portfolio
        """
        # Generate bio
        bio = self.generate_bio(request.resume_data, request.tone)
        
        # Get projects from resume data (or empty list if not present)
        projects = request.resume_data.get("projects", [])
        project_descriptions = self.enhance_project_descriptions(projects, request.tone)
        
        # Get skills from resume data (or empty list if not present)
        skills = request.resume_data.get("skills", [])
        skills_summary = self.generate_skills_summary(skills)
        
        # Generate meta description for SEO
        name = request.resume_data.get("contact", {}).get("name", "Professional")
        meta_description = f"Portfolio of {name}, showcasing projects, skills, and professional experience."
        
        # Generate a unique ID for this generation
        generation_id = str(uuid.uuid4())
        
        return GenerationResponse(
            bio=bio,
            project_descriptions=project_descriptions,
            skills_summary=skills_summary,
            meta_description=meta_description,
            generation_id=generation_id
        )
