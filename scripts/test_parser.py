#!/usr/bin/env python3
"""
Test script for the PDF resume parser.

This script takes a PDF resume file as input and outputs the parsed JSON data.
It's useful for testing the parser functionality in isolation.
"""
import argparse
import json
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.parser.pdf_to_json import get_resume_json, PDFParseError


def main():
    """Main entry point for the parser test script."""
    parser = argparse.ArgumentParser(description="Test the PDF resume parser")
    parser.add_argument(
        "pdf_path",
        type=str,
        help="Path to the PDF resume file"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    try:
        # Parse resume
        pdf_path = Path(args.pdf_path)
        if not pdf_path.exists():
            print(f"Error: File not found: {pdf_path}", file=sys.stderr)
            return 1
            
        print(f"Parsing resume: {pdf_path}")
        resume_data = get_resume_json(pdf_path)
        
        # Output results
        if args.output:
            output_path = Path(args.output)
            with open(output_path, "w") as f:
                json.dump(resume_data, f, indent=2)
            print(f"Results saved to: {output_path}")
        else:
            print(json.dumps(resume_data, indent=2))
            
        return 0
    except PDFParseError as e:
        print(f"Error parsing PDF: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
