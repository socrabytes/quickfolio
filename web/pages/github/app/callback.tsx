import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// This page handles GitHub App installation redirects and forwards them to the backend API
const GitHubAppCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Redirecting to API...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Only run this once the router is ready and query params are available
    if (!router.isReady) return;
    
    // Get all query parameters from GitHub's callback
    const { code, installation_id, setup_action, state } = router.query;
    
    // Build the API URL with all the same query parameters
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://quickfolio-api.onrender.com';
    
    // Construct the redirect URL with all query parameters
    const queryString = new URLSearchParams();
    
    // Add each parameter that exists
    if (code) queryString.append('code', code as string);
    if (installation_id) queryString.append('installation_id', installation_id as string);
    if (setup_action) queryString.append('setup_action', setup_action as string);
    if (state) queryString.append('state', state as string);
    
    const redirectUrl = `${apiBaseUrl}/github/app/callback?${queryString.toString()}`;
    
    // Log the redirect for debugging
    console.log(`Redirecting to API: ${redirectUrl}`);
    
    // Redirect to the API endpoint
    setStatus(`Redirecting to ${apiBaseUrl}...`);
    window.location.href = redirectUrl;
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <Head>
        <title>Redirecting to Quickfolio API...</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing GitHub App Installation</h2>
        <p className="text-gray-600 mb-4">
          {status}
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-2">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default GitHubAppCallback;
