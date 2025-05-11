# 🚀 Quickfolio

AI-powered tool that turns resumes into professional portfolio sites in minutes.

## 📋 Overview

Quickfolio is a static-site-as-code generator that transforms a resume or LinkedIn profile into a professional portfolio site. Unlike traditional link-in-bio tools, Quickfolio emphasizes full ownership, SEO benefits, and zero platform lock-in.

### ✨ Key Differentiators

- **Own your site, own your brand, zero lock-in**
- **GitHub-hosted for total control**
- **Fast generation (<120 seconds)**
- **AI-enhanced content from your existing resume**

## 🔧 Quick Start Guide

### Prerequisites

- Python 3.9+
- Google Gemini API key (free tier available)
- GitHub account

### Installation

```bash
# Clone the repository
git clone https://github.com/socrabytes/quickfolio.git
cd quickfolio

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### How to Use

#### Option 1: Command Line Interface

```bash
# Generate and deploy a portfolio from your resume
python scripts/deploy_portfolio.py path/to/your/resume.pdf

# Generate without deploying to GitHub
python scripts/deploy_portfolio.py path/to/your/resume.pdf --skip-deploy
```

#### Option 2: API Server

```bash
# Start the API server
python main.py api

# The API will be available at http://localhost:8000
```

#### Option 3: Web Interface (Coming Soon)

```bash
# Run the Next.js development server
cd web
npm install
npm run dev

# The landing page will be available at http://localhost:3000
```

### Testing

```bash
# Generate a sample resume for testing
python scripts/generate_sample_resume.py

# Test the resume parser
python scripts/test_parser.py samples/sample_resume.pdf

# Test the AI content generator (requires a JSON resume file)
python scripts/test_ai_generator.py path/to/resume_data.json
```

## 🛠️ Project Structure

```
/
├── docs/               # Documentation
│   ├── features/       # User-facing docs
│   ├── patterns/       # Development patterns
│   ├── tasks/          # Implementation details
│   └── workflow/       # Development processes
├── src/
│   ├── parser/         # Resume parsing
│   ├── ai/             # Google Gemini API integration
│   ├── github/         # OAuth and repo management
│   ├── hugo/           # Hugo site generator
│   │   └── themes/     # Tailwind themes
│   └── utils/          # Helper functions
├── web/                # Landing page (Next.js)
└── scripts/            # CI/CD and utility scripts
```

## 🚀 Development Roadmap

### Phase 0: MVP (14 Days) - Completed
- GitHub OAuth → repo creation
- Resume PDF parsing
- OpenAI integration for bio/projects
- Minimal Hugo theme
- GitHub Actions deployment

### Phase 1: Public Alpha - In Progress
- CLI-less onboarding UI
- Custom domain wizard
- Lite hosting plan option

### Phase 2: Content Sync - Planned
- GitHub activity integration
- Dribbble shots gallery
- Medium/blog RSS feed

## 📊 Key Metrics
- Time-to-Live Site (target: <120 seconds)
- NPS from beta users (target: >40)
- Activation rate (% of users who publish)

## 📝 Documentation

- [Features Overview](docs/features/overview.md)
- [Setup Guide for Developers](docs/workflow/setup_guide.md)
- [GitHub Deployment Guide](docs/features/github_deployment.md)
- [Troubleshooting Guide](docs/workflow/troubleshooting.md)

### Setting Up GitHub OAuth

To enable automatic deployment to GitHub Pages:

1. Create a [GitHub OAuth application](https://github.com/settings/developers)
2. Configure Quickfolio with your OAuth credentials in `.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:8000/github/callback
   ```
3. Test your setup with `python scripts/test_github_oauth.py`

For detailed instructions, see the [GitHub Deployment Guide](docs/features/github_deployment.md).

### Gemini API Configuration

Quickfolio uses Google's Gemini API for content generation. Configure your `.env` file:

```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=models/gemini-2.0-flash
GEMINI_MAX_TOKENS=500
GEMINI_TEMPERATURE=0.7
```

Note: The model name must be in the new format `models/gemini-2.0-flash` (not the older `gemini-pro` format).

---

© 2025 Quickfolio
