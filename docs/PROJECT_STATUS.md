# 📊 Quickfolio Project Status - May 2025

## Current Deployment Status

### Frontend
- **Platform:** Render
- **URL:** https://quickfolio.onrender.com
- **Repository Directory:** `/web`
- **Framework:** Next.js
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: Points to the backend API

### Backend API
- **Platform:** Render
- **URL:** https://quickfolio-api.onrender.com
- **Repository Directory:** `/` (root)
- **Framework:** FastAPI
- **Key Environment Variables:**
  - GitHub App configuration
  - Gemini API settings
  - Application settings

## GitHub App Integration

### Current Configuration
- **App Name:** Quickfolio
- **Homepage URL:** https://quickfolio.onrender.com
- **Callback URL:** https://quickfolio-api.onrender.com/github/app/callback
- **Permissions:** Repository creation and content

### Known Issues
1. **Permission Model Limitation:**
   - GitHub Apps can only access all repositories or specific existing repositories
   - Current workflow requires users to grant access to all repositories
   - This doesn't follow the least privilege principle

## Implementation Plan for Permission Model Redesign

### Frontend Tasks
1. Create `RepoSelector.tsx` component with two states:
   - Manual input for existing repos
   - "Create new" option with deep link to GitHub's repo creation

2. Update install flow to use:
   ```
   https://github.com/apps/quickfolio/installations/new
       ?state=<JWT|nonce>
       &repository_ids=<ID-if-already-created>
   ```

3. Enhance success screen to show the generated site URL

### Backend Tasks
1. Update deployment endpoint to verify repo existence
2. Remove code that creates repos automatically
3. Update token exchange flow

### Documentation Tasks
1. Add "Why we ask for repo access" section to README
2. Create SECURITY.md to outline permission model
3. Update CONTRIBUTING.md with local dev flow instructions

## Next Steps
1. Update GitHub issues to reflect current status
2. Implement permission model redesign
3. Conduct comprehensive testing of the new flow

---

*Last Updated: May 14, 2025*
