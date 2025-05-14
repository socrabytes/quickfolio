# Security Policy

## 🔒 GitHub App Permission Model

### Current Model
The current version of Quickfolio requires users to install a GitHub App with access to either:
- All repositories (which grants more access than needed)
- Only selected repositories (which doesn't work with our repo creation flow)

### Improved Model (Coming Soon)
We're implementing a security-first approach that follows the principle of least privilege:

1. **User creates/selects a repository first**
   - Users will either create a new repository manually or select an existing one
   - This removes the need for "All Repositories" access

2. **GitHub App requests minimal permissions**
   - Only `Contents: Write` permission on the selected repository
   - No unnecessary scopes requested

3. **Transparent permission flow**
   - Clear explanation of exactly what access is needed and why
   - User-controlled repository selection

## 🔓 Vulnerability Reporting

If you discover a security vulnerability within Quickfolio, please send an email to [security@example.com](mailto:security@example.com). All security vulnerabilities will be promptly addressed.

## 🔑 API Key Security

### Google Gemini API
- API keys are only stored server-side and never exposed to clients
- Rate limiting is applied to prevent abuse
- Keys are validated during startup to ensure they work before accepting user requests

### GitHub App Credentials
- Private keys are stored securely and never exposed in logs or responses
- Client secrets are only used server-side and never exposed to clients
- Installation tokens are short-lived and scoped to specific repositories

## 📄 Data Retention

Quickfolio minimizes data storage:
- Resume text is processed and discarded after generating content
- No user credentials are stored
- GitHub tokens are temporary and not persisted

For more information about our security practices, please contact us at [security@example.com](mailto:security@example.com).
