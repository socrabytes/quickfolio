# Changelog

All notable changes to Quickfolio will be documented in this file.

## [Unreleased]

### ✨ Added
- Initial repository setup
- Basic project structure
- Comprehensive README with project overview
- Resume PDF parser implementation 
- Google Gemini API integration for content generation
- Hugo templates with minimal theme
- FastAPI backend application
- Next.js landing page with waitlist form
- Test scripts for core functionality

### 🔧 Fixed
- 🐛 (api): Fixed Hugo site generation permissions issue
- 🐛 (hugo): Corrected template file copying with proper permissions
- 🚀 (api): Updated Gemini API integration to use models/gemini-2.0-flash
- 🔥 (project): Removed redundant venv/ directory for cleaner structure

### 🧰 Implemented
- ✨ (github): Complete GitHub OAuth integration with repository automation
- ✨ (web): CLI-less onboarding UI with multi-step wizard
- 🚀 (web): Created API service layer for frontend-backend communication
- 📝 (docs): Added GitHub deployment guide and troubleshooting documentation
- 🔧 (project): Set up issue tracking with organized labels and priorities

### 🚧 In Progress
- 🔄 Custom domain wizard (next focus)
- 🔄 Lite hosting plan option
- 🔄 Code quality improvements (Pydantic v2, error handling)
- 🔄 Testing framework implementation

### 📋 Planned
- Additional Hugo themes (professional, creative)
- Resume data validation and enrichment
- Content sync modules (GitHub, Dribbble, Medium)

## Development Sprint Plan

### Days 1-2: Foundation & Repository Setup
- [x] Create GitHub repository with basic structure
- [ ] Set up development environment and dependencies
- [ ] Scaffold Hugo base template
- [ ] Configure GitHub Actions for site deployment

### Days 3-4: Resume Parser
- [ ] Build PDF parser with pdfplumber
- [ ] Define JSON schema for structured resume data
- [ ] Create unit tests with sample resumes

### Days 5-7: AI Content Generation
- [ ] Set up OpenAI API integration
- [ ] Design prompts for bio generation and project descriptions
- [ ] Implement content caching to minimize API costs

### Days 8-9: Theme Development
- [ ] Develop 3 distinct Tailwind-based Hugo themes
- [ ] Ensure responsive design and accessibility

### Day 10: GitHub Integration
- [ ] Implement GitHub OAuth flow
- [ ] Build repository creation and content push functionality

### Day 11: Landing Page
- [ ] Develop Next.js landing page with waitlist signup
- [ ] Set up analytics to track signups

### Days 12-13: Beta Testing
- [ ] Onboard 10 beta users
- [ ] Collect feedback and iterate on critical issues

### Day 14: Launch Preparation
- [ ] Fix high-priority bugs from beta feedback
- [ ] Prepare Product Hunt assets
