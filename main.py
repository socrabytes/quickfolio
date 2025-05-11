#!/usr/bin/env python3
"""
Quickfolio - AI-powered portfolio generator

This is the main entry point for the Quickfolio application.
It provides a command-line interface to run the API server.
"""
import argparse
import os
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.api.app import start as start_api
from src.config import PORT, HOST


def main():
    """Main entry point for the Quickfolio application."""
    parser = argparse.ArgumentParser(description="Quickfolio - AI-powered portfolio generator")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # API server command
    api_parser = subparsers.add_parser("api", help="Run the API server")
    api_parser.add_argument(
        "--port",
        type=int,
        default=PORT,
        help=f"Port to run the server on (default: {PORT})"
    )
    api_parser.add_argument(
        "--host",
        type=str,
        default=HOST,
        help=f"Host to bind the server to (default: {HOST})"
    )
    
    # Parse arguments
    args = parser.parse_args()
    
    # Execute command
    if args.command == "api":
        print(f"Starting Quickfolio API server on {args.host}:{args.port}")
        # Override config with command line arguments
        os.environ["PORT"] = str(args.port)
        os.environ["HOST"] = args.host
        start_api()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
