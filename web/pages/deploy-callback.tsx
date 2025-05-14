/**
 * GitHub OAuth Callback Page
 * 
 * This page handles the callback from the backend GitHub OAuth flow,
 * storing the user info and token in localStorage before redirecting
 * to the deployment step.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function DeployCallback() {
  const router = useRouter();

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;
    
    // Check if we have query params (runs after router is ready)
    if (!router.isReady) return;

    // Handle error case
    if (router.query.error) {
      console.error('GitHub auth error:', router.query.error);
      router.push('/create?step=deploy&error=' + encodeURIComponent(router.query.error as string));
      return;
    }

    // Extract GitHub data from URL query params
    const githubData = {
      username: router.query.username,
      name: router.query.name || router.query.username,
      avatar_url: router.query.avatar_url,
    };

    // Extract token
    const token = router.query.access_token;

    if (!token || !githubData.username) {
      console.error('Missing required GitHub data');
      router.push('/create?step=deploy&error=Missing+required+GitHub+data');
      return;
    }

    // Store GitHub user data and token in localStorage
    localStorage.setItem('github_user', JSON.stringify(githubData));
    localStorage.setItem('github_token', token as string);
    
    // Redirect back to the deployment step
    router.push('/create?step=deploy&success=true');
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Connecting to GitHub | Quickfolio</title>
      </Head>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <h2 className="mt-4 text-xl font-medium text-gray-900">Connecting your GitHub account...</h2>
        <p className="mt-2 text-sm text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}
