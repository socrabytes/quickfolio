import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// This page handles GitHub App installation redirects and forwards them to the backend API
const GitHubAppCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({}); 
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Only run this once the router is ready and query params are available
    if (!router.isReady) return;
    
    try {
      setStatus('Processing GitHub callback parameters...');
      // Get all query parameters from GitHub's callback
      const { code, installation_id, setup_action, state } = router.query;
      
      // Store debug info
      setDebugInfo({
        query: router.query,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
      
      if (!installation_id && !code) {
        setError('Missing required GitHub callback parameters (installation_id or code)');
        setStatus('Error: Invalid callback data');
        return;
      }
      
      // Build the API URL with all the same query parameters
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://quickfolio-api.onrender.com';
      
      // Construct the redirect URL with all query parameters
      const queryString = new URLSearchParams();
      
      // Add each parameter that exists
      if (code) queryString.append('code', code as string);
      if (installation_id) queryString.append('installation_id', installation_id as string);
      if (setup_action) queryString.append('setup_action', setup_action as string);
      if (state) queryString.append('state', state as string);
      
      const fullRedirectUrl = `${apiBaseUrl}/github/app/callback?${queryString.toString()}`;
      setRedirectUrl(fullRedirectUrl);
      
      // Log the redirect for debugging
      console.log(`GitHub App Callback Processing:`, {
        params: router.query,
        redirectingTo: fullRedirectUrl
      });
      
      // Option 1: Redirect using fetch first to test API connectivity
      setStatus(`Testing API connection before redirect...`);
      
      fetch(apiBaseUrl, { method: 'GET' })
        .then(response => {
          if (response.ok) {
            setStatus(`API connection successful, redirecting to ${apiBaseUrl}...`);
            // Now that we confirmed API is accessible, proceed with redirect
            setTimeout(() => {
              window.location.href = fullRedirectUrl;
            }, 2000); // Short delay to allow reading the status
          } else {
            throw new Error(`API returned status ${response.status}`);
          }
        })
        .catch(err => {
          console.error('API connection test failed:', err);
          setError(`Failed to connect to API: ${err.message}\n\nYou can try manually going to /create?installation_id=${installation_id}`);
          setStatus('Error connecting to API');
        });
        
    } catch (err: any) {
      console.error('Error in GitHub callback handler:', err);
      setError(`Error processing GitHub callback: ${err.message}`);
      setStatus('Error occurred');
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <Head>
        <title>Processing GitHub Installation - Quickfolio</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {!error ? (
          <>
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">GitHub App Installation</h2>
            <p className="text-gray-600 mb-4">
              {status}
            </p>
            {redirectUrl && (
              <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded overflow-hidden">
                <p className="mb-1">Redirecting to:</p>
                <code className="block truncate">{redirectUrl}</code>
              </div>
            )}
          </>
        ) : (
          <>
            <svg className="h-10 w-10 text-red-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
            <p className="text-gray-700 mb-4 whitespace-pre-line">
              {error}
            </p>
            <div className="mt-4 space-y-3">
              {router.query.installation_id && (
                <Link href={`/create?installation_id=${router.query.installation_id}`} className="block w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors">
                  Continue to Create Page
                </Link>
              )}
              <Link href="/" className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors">
                Return to Home
              </Link>
            </div>
          </>
        )}
        
        {/* Debug Information */}
        <div className="mt-8 border-t pt-4">
          <details className="text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">Debug Information</summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-48">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default GitHubAppCallback;
