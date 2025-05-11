# 🚀 Quickfolio

AI-powered tool that turns resumes into professional portfolio sites in minutes.

## 📋 Overview

Quickfolio is a static-site-as-code generator that transforms a resume or LinkedIn profile into a professional portfolio site. Unlike traditional link-in-bio tools, Quickfolio emphasizes full ownership, SEO benefits, and zero platform lock-in.

### ✨ Key Differentiators

- **Own your site, own your brand, zero lock-in**
- **GitHub-hosted for total control**
- **Fast generation (<120 seconds)**
- **AI-enhanced content from your existing resume**

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
│   ├── ai/             # OpenAI integration
│   ├── github/         # OAuth and repo management
│   ├── hugo/           # Hugo site generator
│   │   └── themes/     # Tailwind themes
│   └── utils/          # Helper functions
├── web/                # Landing page (Next.js)
└── scripts/            # CI/CD and utility scripts
```

## 🚀 Development Roadmap

### Phase 0: MVP (14 Days)
- GitHub OAuth → repo creation
- Resume PDF parsing
- OpenAI integration for bio/projects
- 3 curated Hugo themes
- GitHub Actions deployment

### Phase 1: Public Alpha
- CLI-less onboarding UI
- Custom domain wizard
- Lite hosting plan option

### Phase 2: Content Sync
- GitHub activity integration
- Dribbble shots gallery
- Medium/blog RSS feed

## 📊 Key Metrics
- Time-to-Live Site (target: <120 seconds)
- NPS from beta users (target: >40)
- Activation rate (% of users who publish)

## 🔧 Development Setup

Instructions coming soon...

---

© 2025 Quickfolio
