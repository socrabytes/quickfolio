/**
 * Demo GitHub Auth Bypass
 * 
 * This is a temporary development page to simulate GitHub auth without
 * actual OAuth. ONLY FOR DEVELOPMENT TESTING.
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DemoGithubAuth() {
  const router = useRouter();
  const [username, setUsername] = useState('demo-user');
  
  const handleConnect = () => {
    // Store mock GitHub user data
    localStorage.setItem('github_user', JSON.stringify({
      username: username,
      name: `${username} (Demo)`,
      avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
    }));
    
    // Store demo token
    localStorage.setItem('github_token', 'demo-token-for-development-only');
    
    // Check if we need to create demo content
    const hasContent = localStorage.getItem('mvp_content');
    
    if (!hasContent) {
      // Create demo content and store it
      const demoContent = {
        profile: {
          name: `${username} (Demo)`,
          headline: 'Software Developer & Open Source Enthusiast',
          avatar: 'avatar.jpg'
        },
        links: [
          {
            text: 'GitHub',
            url: `https://github.com/${username}`,
            icon: 'github'
          },
          {
            text: 'LinkedIn',
            url: 'https://linkedin.com/in/demo-user',
            icon: 'linkedin'
          },
          {
            text: 'Portfolio',
            url: `https://${username.toLowerCase().replace(/\s+/g, '')}.dev`
          },
          {
            text: 'Email',
            url: `mailto:${username.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            icon: 'envelope'
          },
          {
            text: 'Resume',
            url: `#`,
            icon: 'file-pdf'
          }
        ]
      };
      
      localStorage.setItem('mvp_content', JSON.stringify(demoContent));
      console.log('Created demo content:', demoContent);
    }
    
    // Redirect to deploy page
    router.push('/create?step=deploy&success=true');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Demo GitHub Auth | Quickfolio</title>
        <meta name="description" content="Demo GitHub Auth for development" />
      </Head>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Demo GitHub Authorization</h1>
            <p className="text-gray-600 mt-2">
              This bypasses actual GitHub OAuth for development purposes only.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <button
            onClick={handleConnect}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Simulate GitHub Login
          </button>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-red-500">
              ⚠️ For development only! Replace with real GitHub OAuth in production.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
