#!/usr/bin/env python3
"""
List available Gemini models.

This script lists all available models for the configured Gemini API key.
"""
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

import google.generativeai as genai
from src.config import GEMINI_API_KEY

def main():
    """List available Gemini models."""
    print(f"Configuring Gemini API with key: {GEMINI_API_KEY[:5]}...")
    genai.configure(api_key=GEMINI_API_KEY)
    
    try:
        print("Fetching available models...")
        models = genai.list_models()
        
        print("\nAvailable models:")
        for model in models:
            print(f"- {model.name}")
            print(f"  Supported generation methods: {model.supported_generation_methods}")
            print()
            
        return 0
    except Exception as e:
        print(f"Error listing models: {type(e).__name__}: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
