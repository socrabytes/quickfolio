# GitHub Deployment

This guide explains how to set up GitHub OAuth integration for Quickfolio, which enables automatic deployment of portfolio sites to GitHub Pages.

## Prerequisites

- A GitHub account
- Quickfolio installed and configured with Gemini API
- Basic understanding of OAuth authentication flow

## Setting Up GitHub OAuth

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the application details:
   - **Application name**: Quickfolio
   - **Homepage URL**: http://localhost:8000 (or your production URL)
   - **Authorization callback URL**: http://localhost:8000/github/callback
5. Click "Register application"
6. Note your **Client ID**
7. Click "Generate a new client secret" and note your **Client Secret**

### 2. Configure Quickfolio with OAuth Credentials

Add your GitHub OAuth credentials to your `.env` file:

```
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_client_id_from_github
GITHUB_CLIENT_SECRET=your_client_secret_from_github
GITHUB_CALLBACK_URL=http://localhost:8000/github/callback
```

## How GitHub Deployment Works

Quickfolio's GitHub deployment process follows these steps:

1. **Authentication**: User authenticates with GitHub via OAuth
2. **Repository Creation**: A new GitHub Pages repository is created
3. **Content Generation**: Hugo site is generated from resume and AI content
4. **Deployment**: Content is pushed to the repository
5. **Publishing**: GitHub Pages automatically publishes the site

## Testing the GitHub Integration

### Using the API Server

1. Start the API server:
   ```bash
   python main.py api
   ```

2. Access the GitHub login endpoint:
   ```
   http://localhost:8000/github/login
   ```

3. Complete the OAuth flow by authorizing Quickfolio

4. You'll be redirected to the callback URL with your GitHub information

### Using the Test Script

Run the GitHub OAuth test script:

```bash
python scripts/test_github_oauth.py
```

This will provide instructions and the OAuth URL to test.

## Troubleshooting

### Common Issues

1. **OAuth Error: Invalid Client ID**
   - Ensure your Client ID is correctly copied to .env
   - Verify the OAuth App is properly registered

2. **OAuth Error: Callback URL Mismatch**
   - Ensure the callback URL in your .env file matches exactly what you registered

3. **Repository Creation Fails**
   - Check if a repository with the same name already exists
   - Verify the access token has the 'repo' scope

4. **Permission Denied**
   - Ensure you granted all required permissions during OAuth authorization
