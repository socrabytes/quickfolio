import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * GitHub OAuth callback handler
 */
const Callback: NextPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing GitHub authorization...');
  
  useEffect(() => {
    // Process only after router is ready and query params are available
    if (!router.isReady) return;
    
    const { code, error } = router.query;
    
    // Handle error in the OAuth flow
    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }
    
    // Handle missing code
    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }
    
    // Process the authorization code
    const processCode = async () => {
      try {
        // In a production app, this would be a server-side API call for security
        // For development, we're directly showing the success state
        // The actual API call would be something like:
        // const response = await fetch(`/api/github-callback?code=${code}`);
        // const data = await response.json();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatus('success');
        setMessage('GitHub authorization successful!');
        
        // Redirect to deployment page after success
        setTimeout(() => {
          router.push('/create?step=deploy');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(`Error processing authorization: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    processCode();
  }, [router, router.isReady, router.query]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>GitHub Authorization | Quickfolio</title>
        <meta name="description" content="Authorizing with GitHub" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">GitHub Authorization</h1>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center text-green-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-gray-600">{message}</p>
              <p className="mt-2 text-gray-500">Redirecting to deployment page...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center text-red-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-gray-600">{message}</p>
              <button 
                onClick={() => router.push('/create')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Return to Portfolio Creation
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Callback;
