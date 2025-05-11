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

#### Option 3: Web Interface (In Development)

```bash
# Run the Next.js development server
cd web
npm install
npm run dev

# The landing page will be available at http://localhost:3000
```

To test the portfolio creation wizard:
1. Start the API server: `python main.py api`
2. In another terminal, start the web UI: `cd web && npm run dev`
3. Visit http://localhost:3000 and click "Create Portfolio"
4. Follow the step-by-step wizard

Currently implemented web features:
- Resume upload and parsing UI
- Theme selection with visual previews
- Portfolio customization interface
- GitHub OAuth integration for one-click deployment
- API service layer connecting frontend to backend

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

## 🎨 Theme System

Quickfolio features a flexible theme system that allows users to choose from different visual styles for their link-in-bio pages.

### Available Themes

1. **Lynx** - A clean, minimal Hugo-based theme with:
   - Light color scheme optimized for readability
   - Professional link layout with icons
   - Excellent SEO optimization
   - TOML configuration for Hugo deployment

2. **Nebula** - A modern dark-themed design featuring:
   - Dark background with purple gradient accents
   - Card-based link layout with subtle glow effects
   - Mobile-optimized responsive design
   - Standalone HTML/CSS output

### Theme Architecture

Themes are built with a modular architecture that separates concerns:

```
web/
  └─ themes/
      ├─ index.ts        # Registry & interfaces
      ├─ lynx/           # Hugo-based theme
      │   ├─ preview.tsx # React preview component
      │   ├─ meta.json   # Theme metadata
      │   └─ generator.ts# TOML configuration generator
      └─ nebula/         # Dark card theme
          ├─ preview.tsx # React preview component
          ├─ meta.json   # Theme metadata
          └─ generator.ts# HTML/CSS generator
```

### Creating New Themes

To add a new theme to Quickfolio:

1. Create a new directory in `web/themes/` for your theme (e.g., `web/themes/aurora/`)
2. Create the following files:
   - `meta.json`: Theme metadata (name, description, tags)
   - `preview.tsx`: React component for visual preview
   - `generator.ts`: Output generator (TOML, HTML, etc.)
   - `index.ts`: Registration file that imports the above

3. Register your theme by importing it in `web/themes/index.ts`

Each theme must implement the `Theme` interface defined in `web/themes/index.ts`, which includes:
- `meta`: Theme metadata
- `previewComponent`: React component for visual preview
- `generator`: Function to generate deployable output

See existing themes for examples of implementation patterns.
```

## 🚀 Development Roadmap

### Phase 0: MVP (14 Days) - Completed
- GitHub OAuth → repo creation
- Resume PDF parsing
- OpenAI integration for bio/projects
- Minimal Hugo theme
- GitHub Actions deployment

### Phase 1: Public Alpha - In Progress
- ✅ GitHub OAuth integration
- ✅ CLI-less onboarding UI
- ✅ Multiple theme options with visual previews
- 🔄 Custom domain wizard (next focus)
- 🔄 Lite hosting plan option

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

For developers, check our [GitHub Issues](https://github.com/socrabytes/quickfolio/issues) for current development status and planned tasks. We use a structured workflow with labeled issues to track progress on all features.

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
