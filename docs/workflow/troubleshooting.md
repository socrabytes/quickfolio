# Troubleshooting Guide

This guide helps troubleshoot common issues you might encounter when using Quickfolio.

## API Configuration Issues

### Gemini API Problems

**Issue: "404 models/gemini-pro is not found for API version v1beta"**
- **Solution**: Update your model name in `.env` to use the new format:
  ```
  GEMINI_MODEL=models/gemini-2.0-flash
  ```
  The older `gemini-pro` format is no longer supported.

**Issue: Unable to generate content**
- **Solution**: 
  1. Verify your Gemini API key is correct
  2. Check API limits (free tier has request limitations)
  3. Test direct API access with `python scripts/test_ai_generator.py`

### GitHub OAuth Issues

**Issue: OAuth authorization fails**
- **Solution**:
  1. Verify your Client ID and Secret are correct in `.env`
  2. Ensure callback URL in GitHub Developer settings matches `.env` exactly
  3. Check network connectivity to GitHub

**Issue: Repository creation fails**
- **Solution**:
  1. Ensure your GitHub account has no repository with the same name
  2. Verify you granted proper permissions during OAuth flow
  3. Check for GitHub API rate limits

## Resume Parsing Issues

**Issue: PDF parsing fails**
- **Solution**:
  1. Ensure PDF is readable and not encrypted
  2. Try converting to a different PDF format
  3. Test with sample resume: `python scripts/test_parser.py samples/sample_resume.pdf`

**Issue: Resume data is incomplete**
- **Solution**:
  1. Use a well-structured resume with clear sections
  2. Check console output for parsing warnings
  3. Manually check JSON output for missing data

## Hugo Site Generation Issues

**Issue: Hugo build fails**
- **Solution**:
  1. Verify Hugo is installed correctly
  2. Check for syntax errors in template files
  3. Ensure theme files have proper permissions

**Issue: Site appears broken or unstyled**
- **Solution**:
  1. Verify template files were copied correctly
  2. Check template variable names match what your theme expects
  3. Try a different theme to isolate the issue

## Deployment Issues

**Issue: Portfolio deployment hangs or times out**
- **Solution**:
  1. Check internet connection
  2. Verify GitHub API is operational
  3. Try deploying a smaller portfolio first

**Issue: Changes don't appear on GitHub Pages**
- **Solution**:
  1. Wait 5-10 minutes for GitHub Pages to build
  2. Check repository settings to ensure Pages is enabled
  3. Verify the repository has the correct branch configured for Pages

## Environment Setup Issues

**Issue: Missing dependencies**
- **Solution**:
  1. Re-run `pip install -r requirements.txt`
  2. Check Python version (requires 3.9+)
  3. Create a fresh virtual environment: `python -m venv venv_new`

**Issue: Configuration not loading**
- **Solution**:
  1. Verify `.env` file exists in project root
  2. Check `.env` format for syntax errors
  3. Manually test with environment variables: `export GEMINI_API_KEY=your_key && python scripts/test_ai_generator.py`
