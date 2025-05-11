#!/usr/bin/env python3
"""
Test script for the AI content generator.

This script takes a JSON resume data file as input and outputs AI-generated content.
It's useful for testing the content generation functionality in isolation.
"""
import argparse
import json
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ai.content_generator import ContentGenerator, GenerationRequest


def main():
    """Main entry point for the AI generator test script."""
    parser = argparse.ArgumentParser(description="Test the AI content generator")
    parser.add_argument(
        "resume_json",
        type=str,
        help="Path to the JSON resume data file"
    )
    parser.add_argument(
        "--tone",
        type=str,
        default="professional",
        choices=["professional", "casual", "academic"],
        help="Tone for the generated content (default: professional)"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    try:
        # Load resume data
        resume_path = Path(args.resume_json)
        if not resume_path.exists():
            print(f"Error: File not found: {resume_path}", file=sys.stderr)
            return 1
            
        with open(resume_path, "r") as f:
            resume_data = json.load(f)
            
        print(f"Generating content with tone: {args.tone}")
        
        # Initialize content generator
        generator = ContentGenerator()
        
        # Create generation request
        request = GenerationRequest(
            resume_data=resume_data,
            tone=args.tone,
        )
        
        # Generate content
        content = generator.generate_all_content(request)
        
        # Output results
        result = content.dict()
        if args.output:
            output_path = Path(args.output)
            with open(output_path, "w") as f:
                json.dump(result, f, indent=2)
            print(f"Results saved to: {output_path}")
        else:
            print(json.dumps(result, indent=2))
            
        return 0
    except Exception as e:
        print(f"Error generating content: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
