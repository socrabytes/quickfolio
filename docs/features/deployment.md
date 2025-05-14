# Deployment Guide

## Current Deployment Architecture

Quickfolio uses a two-service architecture deployed on Render:

### Backend API (FastAPI)

- **Service Name:** `quickfolio-api`
- **URL:** https://quickfolio-api.onrender.com
- **Repository Directory:** Project root (/)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn src.api.app:app --host 0.0.0.0 --port $PORT`

#### Environment Variables
- `GITHUB_APP_ID`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_PRIVATE_KEY_PATH`
- `GITHUB_APP_INSTALLATION_CALLBACK_URL`
- `GITHUB_APP_NAME`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_MAX_TOKENS`
- `GEMINI_TEMPERATURE`
- `DEBUG`
- `PORT`
- `HOST`
- `MAX_PDF_SIZE_MB`
- `CACHE_EXPIRY_SECONDS`

### Frontend (Next.js)

- **Service Name:** `quickfolio`
- **URL:** https://quickfolio.onrender.com
- **Repository Directory:** `/web`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Environment Variables
- `NEXT_PUBLIC_API_URL`: Set to the backend API URL (`https://quickfolio-api.onrender.com`)

## Local Development Setup

### Backend
```bash
# From project root
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.app:app --reload
```

### Frontend
```bash
# From /web directory
npm install
npm run dev
```

## Known Issues

1. **GitHub App Permission Model**: Currently requires broad repository access. See [Issue #13](https://github.com/socrabytes/quickfolio/issues/13) for the planned fix.

2. **Environment Setup**: The private key path configuration requires adjustment when deploying to Render. Ensure the path is correctly set and the key is available.

## Deployment Checklist

- [ ] Ensure all environment variables are set in Render
- [ ] Verify GitHub App configuration (Homepage URL, Callback URL)
- [ ] Test the complete flow from portfolio creation to GitHub deployment
- [ ] Check logs for any errors or warnings

For more details on project status, see [PROJECT_STATUS.md](../PROJECT_STATUS.md).
