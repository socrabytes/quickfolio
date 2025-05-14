/**
 * Portfolio Deployment API Route
 * 
 * This API route handles the deployment of the portfolio to GitHub Pages.
 * It forwards the request to the backend API for repository creation and content deployment.
 */
import type { NextApiRequest, NextApiResponse } from 'next/types';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Deployment response interface
 */
interface DeploymentResponse {
  deployment_url: string;
  repository_url: string;
  message: string;
}

/**
 * Deployment handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Deploy API handler called');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Request body:', {
      ...req.body,
      access_token: req.body.access_token ? '[REDACTED]' : undefined
    });
    
    const { access_token, repo_name, theme_id, content } = req.body;

    // Validate required parameters
    if (!access_token) {
      res.status(400).json({ error: 'Missing access_token parameter' });
      return;
    }

    if (!content) {
      res.status(400).json({ error: 'Missing content parameter' });
      return;
    }

    // Create form data for the backend API
    const formData = new FormData();
    formData.append('access_token', access_token);
    formData.append('resume_data', JSON.stringify({})); // Empty for now, could be enhanced later
    formData.append('generated_content', JSON.stringify(content));
    formData.append('theme', theme_id || 'lynx');
    
    if (repo_name) {
      formData.append('repo_name', repo_name);
    }

    console.log('Sending request to backend:', `${API_BASE_URL}/deploy`);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/deploy`, {
      method: 'POST',
      body: formData,
    });

    console.log('Backend response status:', response.status);
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from backend:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Failed to parse error response as JSON:', e);
        errorData = { detail: errorText || 'Unknown error from backend' };
      }
      
      res.status(response.status).json({
        error: 'Deployment failed',
        detail: errorData.detail || 'Unknown error',
      });
      return;
    }

    // Return the response from the backend
    const responseText = await response.text();
    console.log('Success response from backend:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText) as DeploymentResponse;
    } catch (e) {
      console.error('Failed to parse success response as JSON:', e);
      res.status(500).json({
        error: 'Invalid response format from backend',
        detail: 'The backend returned a non-JSON response'
      });
      return;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in deployment:', error);
    res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
