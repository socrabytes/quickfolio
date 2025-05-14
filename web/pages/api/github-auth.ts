/**
 * GitHub OAuth Authentication API Route
 * 
 * This API route redirects the user to the GitHub OAuth authorization page.
 */
import type { NextApiRequest, NextApiResponse } from 'next/types';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GitHub authentication handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Redirect to the backend GitHub login endpoint
    res.redirect(`${API_BASE_URL}/github/login`);
  } catch (error) {
    console.error('Error in GitHub authentication:', error);
    res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
