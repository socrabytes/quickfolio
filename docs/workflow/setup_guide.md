# Quickfolio Developer Setup Guide

This guide will help you set up your development environment for Quickfolio.

## Prerequisites

- Python 3.9+
- Node.js 16+
- Git
- GitHub account

## Backend Setup

1. **Clone the repository**

```bash
git clone https://github.com/socrabytes/quickfolio.git
cd quickfolio
```

2. **Create a virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Copy the example environment file from the project root:

```bash
cp .env.example .env
```

Edit the `.env` file in the project root and add your API keys:

- Get a free Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - No credit card required for the free tier
  - Generous free quota of 60 requests per minute
- Create a GitHub OAuth App at [https://github.com/settings/developers](https://github.com/settings/developers)
  - Set the callback URL to `http://localhost:8000/github/callback`

5. **Run the API server**

```bash
python main.py api
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

1. **Install Node.js dependencies**

```bash
cd web
npm install
```

2. **Run the development server**

```bash
npm run dev
```

The landing page will be available at `http://localhost:3000`.

## Testing

### Testing the PDF Parser

1. **Generate a sample resume**

```bash
python scripts/generate_sample_resume.py
```

This will create a sample resume at `samples/sample_resume.pdf`.

2. **Test the parser**

```bash
python scripts/test_parser.py samples/sample_resume.pdf
```

### Testing the AI Content Generator

```bash
python scripts/test_ai_generator.py path/to/resume_data.json
```

### Testing GitHub Integration

```bash
python scripts/test_github_integration.py
```

Follow the instructions to complete the OAuth flow.

## Development Workflow

1. Create a feature branch:

```bash
git checkout -b feat/[issue-number]-description
```

2. Make your changes and test them

3. Commit your changes following the Gitmoji convention:

```bash
git commit -m "✨ (parser): Add support for docx files"
```

4. Push your branch and create a pull request

## Code Standards

- Use type hints everywhere
- Follow the single responsibility principle
- Write tests for new functionality
- Document your code with docstrings
