/**
 * GitHub OAuth Callback API Route
 * 
 * This API route serves as a proxy between the frontend and the backend API
 * for handling GitHub OAuth callbacks. It exchanges the authorization code
 * for an access token and returns user information.
 */
import type { NextApiRequest, NextApiResponse } from 'next/types';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GitHub callback handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  // Validate code parameter
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid code parameter' });
  }

  try {
    // Forward the code to the backend API
    const response = await fetch(`${API_BASE_URL}/github/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: 'GitHub authentication failed',
        detail: errorData.detail || 'Unknown error',
      });
    }

    // Return the response from the backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
