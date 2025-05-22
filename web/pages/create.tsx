import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemePicker from '../components/ThemePicker';
import RepoSelector from '../components/RepoSelector';
import { getTheme, getThemes, getDefaultThemeId } from '../themes';
import '../themes/lynx';
import '../themes/nebula';
import type { MVPContentData } from '../types/mvp';

// Ensure we have a type for the window object with our custom properties
declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

// Define the form state type
interface FormState {
  resumeFile: File | null;
  resumeText: string;
  tone: string;
  themeId: string;
  installationId: number | null;
  userLogin: string;
  repoName: string;
  portfolioDescription: string;
  isPrivateRepo: boolean;
}

type CreationStep = 'upload' | 'theme' | 'deploy' | 'preview';

interface MVPContentGenerationResponse {
  mvp_content?: MVPContentData;
  raw_ai_response?: string;
}

// --- TypeScript Interfaces for MVP Content ---
interface ProfileData {
  name: string;
  headline: string;
  avatar: string; // e.g., "avatar.jpg"
}

interface LinkData {
  text: string;
  url: string; // pydantic HttpUrl translates to string in TS/JSON
  icon?: string;
  type?: string;
}

// MVPContentData is already imported from types/mvp

interface CreateProps {
  // Component props if any
}

interface FormState {
  resumeFile: File | null;
  resumeText: string;
  tone: string;
  themeId: string;
  installationId: number | null;
  userLogin: string;
  repoName: string;
  portfolioDescription: string;
  isPrivateRepo: boolean;
}

const Create: NextPage<CreateProps> = () => {
  // Router initialization
  const router = useRouter();
  
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<CreationStep>('upload');
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    resumeFile: null,
    resumeText: '',
    tone: 'professional',
    themeId: getDefaultThemeId(),
    installationId: null,
    userLogin: '',
    repoName: '',
    portfolioDescription: 'My Quickfolio-generated portfolio site',
    isPrivateRepo: false,
  });
  
  // GitHub related state
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string | null>(null);
  const [githubRepoId, setGithubRepoId] = useState<string | null>(null);
  const [githubAppInstallUrl, setGithubAppInstallUrl] = useState<string>(
    process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || 'https://github.com/apps/quickfolio/installations/new'
  );
  
  // UI state
  const [isRepoValidating, setIsRepoValidating] = useState<boolean>(false);
  const [repoValidationError, setRepoValidationError] = useState<string | null>(null);
  const [githubInstallSuccess, setGithubInstallSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mvpContent, setMvpContent] = useState<MVPContentData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean>(false);
  
  // Ensure component returns JSX
  if (!router.isReady) {
    return <div>Loading...</div>;
  }
  
  // Define handleInstallation function
  const handleInstallation = useCallback((installationId: number) => {
    setFormState(prev => ({
      ...prev,
      installationId
    }));
    setGithubInstallSuccess(true);
  }, [setFormState, setGithubInstallSuccess]);
  
  // Handle repository selection
  const handleRepoSelected = useCallback((repoFullName: string) => {
    console.log('Repository selected:', repoFullName);
    setSelectedRepoFullName(repoFullName);
    localStorage.setItem('selected_repo_full_name', repoFullName);
    
    const [userLogin, repoName] = repoFullName.split('/');
    if (userLogin && repoName) {
      setFormState(prev => ({
        ...prev,
        userLogin,
        repoName
      }));
    }
  }, [setFormState, setSelectedRepoFullName]);

  // Handle GitHub App installation
  const handleInstallApp = useCallback(() => {
    // Use the GitHub App installation URL from environment variables or fallback to default
    const installUrl = process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || 'https://github.com/apps/quickfolio/installations/new';
    console.log('Redirecting to GitHub App installation:', installUrl);
    window.location.href = installUrl;
  }, []);

  // Helper function to ensure GitHub username is available
  const ensureGitHubUsername = useCallback(async (): Promise<string> => {
    if (formState.userLogin) {
      return formState.userLogin;
    }
    
    try {
      setDeploymentError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/github/user?installation_id=${formState.installationId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub username');
      }
      
      const data = await response.json();
      const username = data.login;
      
      if (!username) {
        throw new Error('GitHub username not found');
      }
      
      setFormState(prev => ({
        ...prev,
        userLogin: username
      }));
      
      return username;
    } catch (err) {
      const error = err as Error;
      setDeploymentError(`Error fetching GitHub username: ${error.message}`);
      return '';
    }
  }, [formState.installationId, formState.userLogin]);

  // Handle deployment
  const handleDeploy = useCallback(async () => {
    if (!mvpContent) {
      setDeploymentError('No content generated to deploy.');
      return;
    }

    try {
      setDeploymentError(null);
      setIsDeploying(true);

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          mvpContent,
          repoFullName: selectedRepoFullName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Deployment failed');
      }

      const data = await response.json();
      setDeploymentSuccess(true);
      // Handle successful deployment (e.g., show success message, redirect, etc.)
    } catch (err) {
      const error = err as Error;
      console.error('Deployment error:', error);
      setDeploymentError(error.message || 'Failed to deploy. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  }, [formState, mvpContent, selectedRepoFullName]);
  
  // Effect to retrieve installation ID from localStorage on component mount
  useEffect(() => {
    const savedInstallationId = localStorage.getItem('github_installation_id');
    if (savedInstallationId) {
      try {
        const id = parseInt(savedInstallationId, 10);
        if (!isNaN(id)) {
          handleInstallation(id);
        }
      } catch (e) {
        console.error('Error parsing installation ID:', e);
      }
    }

    // Check for GitHub redirect with installation_id in URL
    if (router.query.installation_id) {
      const queryId = router.query.installation_id as string;
      try {
        const id = parseInt(queryId, 10);
        if (!isNaN(id)) {
          localStorage.setItem('github_installation_id', id.toString());
          handleInstallation(id);
        }
      } catch (e) {
        console.error('Error parsing URL installation ID:', e);
      }
    }
    
    // Restore selected repo from localStorage if available
    const savedRepoFullName = localStorage.getItem('selected_repo_full_name');
    if (savedRepoFullName) {
      setSelectedRepoFullName(savedRepoFullName);
      const [user, repo] = savedRepoFullName.split('/');
      if (user && repo) {
        setFormState(prev => ({
          ...prev,
          userLogin: user,
          repoName: repo
        }));
      }
    }
  }, [router.query, handleInstallation]);

  // Handle URL parameters for GitHub App installation
  useEffect(() => {
    if (!router.isReady) return;
    
    const handleInstallation = () => {
      const params = new URLSearchParams(window.location.search);
      const { error, error_description } = router.query;
      const installationId = params.get('installation_id');
      const setupAction = params.get('setup_action');
      
      if (!installationId) return;
      
      // Check for successful installation
      if (setupAction === 'install' || setupAction === 'update') {
        console.log('GitHub App installed/updated with installation_id:', installationId);
        
        // Parse the installation ID
        const installationIdNum = parseInt(installationId, 10);
        if (isNaN(installationIdNum)) {
          console.error('Invalid installation ID:', installationId);
          return;
        }
        
        // Update form state with the installation ID
        setFormState(prev => ({
          ...prev,
          installationId: installationIdNum
        }));
        
        // Store in localStorage for persistence
        localStorage.setItem('github_installation_id', installationId);
        console.log('Saved GitHub installation ID to localStorage');
        
        // Restore repository selection if available
        const storedRepoName = localStorage.getItem('selected_repo_full_name');
        if (storedRepoName && !selectedRepoFullName) {
          console.log(`Restoring repository selection: ${storedRepoName}`);
          setSelectedRepoFullName(storedRepoName);
          
          // Parse user/repo from the full name
          if (storedRepoName.includes('/')) {
            const [user, repo] = storedRepoName.split('/');
            setFormState(prev => ({
              ...prev,
              userLogin: user || prev.userLogin,
              repoName: repo || prev.repoName
            }));
          }
        }
        
        // Restore content if available
        const savedContent = localStorage.getItem('mvp_content');
        if (!mvpContent && savedContent) {
          try {
            console.log('Restoring content from localStorage after GitHub redirect');
            const parsedContent = JSON.parse(savedContent) as MVPContentData;
            setMvpContent(parsedContent);
          } catch (e) {
            console.error('Failed to parse content from localStorage:', e);
          }
        }
        
        // Force move to deploy step after successful installation
        setCurrentStep('deploy');
        
        // Clean up URL query parameters after processing
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show success message
        setGithubInstallSuccess(true);
      }
      // Handle installation errors
      else if (params.get('error')) {
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        console.error('GitHub App installation error:', error, errorDescription);
        
        // Clean up the URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show error to user
        setDeploymentError(
          `GitHub App installation failed: ${errorDescription || error || 'Unknown error'}. ` +
          'Please try again or contact support if the issue persists.'
        );
      }
    };
    
    handleInstallation();
  }, [router.isReady, router.query, mvpContent, selectedRepoFullName, formState.userLogin]);

  // Main component render
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['upload', 'customize', 'theme', 'preview', 'deploy'].map((step, index) => (
                <React.Fragment key={step}>
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Error display */}
          {deploymentError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{deploymentError}</p>
            </div>
          )}

          {/* Success message */}
          {githubInstallSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p>GitHub App installed successfully! You can now proceed with deployment.</p>
            </div>
          )}

          {/* Step content will be rendered here */}
          <div className="bg-white rounded-lg shadow p-6">
            {currentStep === 'deploy' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Deploy Your Portfolio</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Repository
                    </label>
                    <RepoSelector 
                      onRepoSelected={handleRepoSelected}
                      installationId={formState.installationId}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleDeploy}
                      disabled={!selectedRepoFullName || !formState.installationId}
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        !selectedRepoFullName || !formState.installationId
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isDeploying ? 'Deploying...' : 'Deploy to GitHub Pages'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Helper functions that should be outside the component
const validateAndGetRepoId = async (repoFullName: string, githubUsername: string) => {
  try {
    setIsRepoValidating(true);
    setRepoValidationError(null);
      const apiUrlBase = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrlBase}/api/github/validate-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header if your API requires it (e.g., JWT token)
          // 'Authorization': `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({ repoFullName, githubUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to validate repository. Please check the name and your permissions.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.repositoryId) {
        setGithubRepoId(data.repositoryId); 
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://quickfolio.onrender.com';
        const redirectUri = `${currentOrigin}/create`;
        setGithubAppInstallUrl(`https://github.com/apps/quickfolio/installations/new?repository_ids[]=${data.repositoryId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
        setRepoValidationError(null); // Clear any error
      } else {
        throw new Error('Repository ID not found in response.');
      }
    } catch (error: any) {
      console.error('Repository validation error:', error);
      setRepoValidationError(error.message || 'An unexpected error occurred during repository validation.');
      // Optionally, reset to generic install URL or keep it, based on desired UX
      setGithubAppInstallUrl('https://github.com/apps/quickfolio/installations/new');
      setGithubRepoId(null);
    }
    setIsRepoValidating(false);
  };

  // Handle deployment
  const handleDeploy = useCallback(async () => {
    if (!mvpContent) {
      setDeploymentError('No content generated to deploy.');
      return;
    }
    
    // Always try to ensure username is set before proceeding
    const hasUsername = ensureGitHubUsername();
    if (!hasUsername) {
      setDeploymentError('GitHub Username is required.');
      return;
    }
    if (!formState.installationId) {
      console.log('No GitHub App installation detected. Redirecting to GitHub for app installation...');
      // Make sure we have a valid installation URL
      if (!githubAppInstallUrl) {
        // Fallback to a generic installation URL if specific one not set
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://quickfolio.onrender.com';
        const redirectUri = `${currentOrigin}/create`;
        window.location.href = `https://github.com/apps/quickfolio/installations/new?redirect_uri=${encodeURIComponent(redirectUri)}`;
      } else {
        // Use the pre-configured installation URL (which may include repository_ids parameter)
        window.location.href = githubAppInstallUrl;
      }
      return;
    }
    if (!formState.userLogin.trim()) {
      setDeploymentError('GitHub Username is required.');
      return;
    }
    if (!selectedRepoFullName) {
      setDeploymentError('Please select a GitHub repository using the repository selector above.');
      return;
    }
    if (repoValidationError && !githubRepoId) {
      setDeploymentError(`Repository validation failed: ${repoValidationError}. Please select a valid repository.`);
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentSuccess(null);

    // Parse repository information from selectedRepoFullName
    // Handle various formats: user/repo, repo, /repo
    let owner = formState.userLogin || '';
    let repo = selectedRepoFullName || '';
    
    try {
      if (selectedRepoFullName) {
        if (selectedRepoFullName.includes('/')) {
          // Format: user/repo
          const parts = selectedRepoFullName.split('/');
          if (parts.length === 2) {
            // Normal case: user/repo
            [owner, repo] = parts;
          } else if (parts.length === 1) {
            // Leading slash: /repo
            repo = parts[0];
          }
        }
        // If no slash, use the full name as repo name
      }
      
      console.log('Parsed repository information:', { owner, repo });
      
      // Validate we have all required parts
      if (!owner || !repo) {
        throw new Error(`Could not determine owner and repo from: ${selectedRepoFullName}`);
      }
    } catch (error) {
      console.error('Error parsing repository information:', error);
      setDeploymentError(`Invalid repository format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDeploying(false);
      return;
    }

    // Create FormData with guaranteed string values to fix TypeScript errors
    const formData = new FormData();
    formData.append('installation_id', formState.installationId?.toString() || '0');
    formData.append('user_login', owner || ''); // Ensure non-undefined string
    formData.append('repo_name', repo || ''); // Ensure non-undefined string
    formData.append('full_repo_name', selectedRepoFullName || ''); // Ensure non-undefined string
    formData.append('repository_id', githubRepoId || ''); // Ensure non-undefined string
    formData.append('generated_content', JSON.stringify(mvpContent || {})); // Ensure valid JSON
    formData.append('theme', formState.themeId || 'lynx'); // Default to 'lynx' if undefined
    formData.append('portfolio_description', formState.portfolioDescription || 'My Quickfolio portfolio'); // Default description
    formData.append('private_repo', (formState.isPrivateRepo || false).toString()); // Default to public
  
    // Add detailed logging to debug deployment issues
    console.log('Deployment params being sent to backend:', {
      installation_id: formState.installationId,
      user_login: owner,
      repo_name: repo,
      full_repo_name: selectedRepoFullName,
      repository_id: githubRepoId,
      theme: formState.themeId,
      portfolio_description: formState.portfolioDescription,
      private_repo: formState.isPrivateRepo,
      // Don't log the entire content for brevity
      content_size: JSON.stringify(mvpContent).length
    });
    // For the current Python `create_pages_repository`, it pushes the whole `template_path`.
    // We need to ensure that `generated_content` is used by the backend to *create* files within that structure.
    // This part needs careful coordination with backend logic for how content is placed in the repo.

    try {
      // Construct the API URL using environment variable if available
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`Using API URL base: ${apiBaseUrl || 'relative path'} for deployment`);
      console.log('Starting deployment process, sending data to /deploy endpoint...');
      
      // Use the environment variable for API base URL
      const response = await fetch(`${apiBaseUrl}/deploy`, {
        method: 'POST',
        body: formData,
      });

      console.log('Received response from /deploy endpoint:', {
        status: response.status,
        statusText: response.statusText,
      });

      let result;
      try {
        result = await response.json();
        console.log('Response body from /deploy endpoint:', result);
      } catch (jsonError: any) {
        console.error('Failed to parse response as JSON:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response body:', textResponse);
        throw new Error(`Failed to parse API response: ${jsonError.message}. Raw response: ${textResponse.substring(0, 100)}...`);
      }

      if (!response.ok) {
        // Provide more detailed error information from the backend
        const errorDetail = result.detail || result.error || result.message || response.statusText;
        console.error('Deployment API error:', {
          status: response.status,
          error: errorDetail,
          result
        });
        throw new Error(`Deployment failed: ${errorDetail}. See console for details.`);
      }

      setDeploymentSuccess(`Successfully deployed to ${result.deployment_url}!\nRepository: ${result.repository_url}`);
      console.log('Deployment successful:', result);
      
      // Provide a direct link to the deployed site
      const deployedUrl = result.deployment_url;
      const repoUrl = result.repository_url;
      
      // Optionally, clear localStorage or redirect to a success page
      // localStorage.removeItem('mvp_content');
      // localStorage.removeItem('github_installation_id'); // User might want to deploy another repo
      // router.push(`/success?url=${result.deployment_url}`);

    } catch (error: any) {
      console.error('Deployment error details:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setDeploymentError('Network error connecting to the backend server. Please check your connection and try again.');
      } else {
        setDeploymentError(error.message || 'An unknown error occurred during deployment. Check console for details.');
      }
    }  
    setIsDeploying(false);
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Create Your Link-in-Bio Page | Quickfolio</title>
        <meta name="description" content="Create your professional link-in-bio page with Quickfolio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Link-in-Bio Page</h1>
          
          {/* Progress indicator */}
          <div className="mt-6 flex justify-between">
            {['upload', 'theme', 'preview', 'deploy'].map((step, index, arr) => (
              <div 
                key={step} 
                className={`flex-1 text-center py-2 border-b-4 ${
                  currentStep === step 
                    ? 'border-primary text-primary font-medium' 
                    : (arr.findIndex(s => s === currentStep) > index ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-400')
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step 1: Resume Upload */}
        {currentStep === 'upload' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Provide Your Resume Content</h2>
            <p className="text-gray-600 mb-4">
              For the MVP, please paste your resume content directly into the text area below.
              We&apos;ll use this to generate your link-in-bio page.
            </p>
            
            <form onSubmit={handleProcessResume} className="space-y-6">
              <div>
                <label htmlFor="resumeText" className="block text-sm font-medium text-gray-700 mb-1">
                  Paste Resume Text:
                </label>
                <textarea
                  id="resumeText"
                  name="resumeText"
                  rows={15}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                  placeholder="Paste your full resume content here..."
                  value={formState.resumeText}
                  onChange={handleResumeTextChange}
                  required={!formState.resumeFile} // Only required if no file is selected
                />
              </div>

              {/* File upload section for PDF resumes */}
              <div className="text-sm text-gray-500 my-4">
                Alternatively, you can upload a PDF resume:
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {!formState.resumeFile ? (
                  <label 
                    htmlFor="resume"
                    className="cursor-pointer text-primary hover:text-primary-dark font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Select a PDF file</span>
                  </label>
                ) : (
                  <div className="text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2">File selected: {formState.resumeFile.name}</p>
                    <button 
                        type="button"
                        onClick={() => setFormState({...formState, resumeFile: null})} 
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                    >
                        Remove file
                    </button>
                  </div>
                )}
              </div>
              
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              {generationError && <p className="text-sm text-red-600 mt-2">Generation Error: {generationError}</p>}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 transition-colors duration-150"
                  disabled={isGenerating || (!formState.resumeText.trim() && !formState.resumeFile)}
                >
                  {isGenerating ? 'Generating Your Page...' : 'Generate Link-in-Bio Page'}
                </button>
              </div>
              
              {/* Sign-up options */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-3">Want to save your projects and unlock more features?</p>
                <a 
                  href="/signup" 
                  className="text-primary hover:text-primary-dark font-medium underline"
                >
                  Create an account
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Already have an account? <a href="/login" className="text-primary hover:underline">Log in</a>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Theme Selection */}
        {currentStep === 'theme' && mvpContent && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Choose Your Theme</h2>
            <p className="text-gray-600 mb-6">
              Select a theme for your link-in-bio page. Each theme has a different style and features.
            </p>
            
            {/* Theme Picker Component */}
            <div className="theme-picker-container">
              {Object.values(getThemes()).map(theme => (
                <div 
                  key={theme.meta.id}
                  onClick={() => handleThemeSelect(theme.meta.id)}
                  className={`theme-option p-4 border rounded-lg mb-4 cursor-pointer ${formState.themeId === theme.meta.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{theme.meta.name}</h3>
                    {formState.themeId === theme.meta.id && (
                      <span className="text-primary-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{theme.meta.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {theme.meta.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Approve Content */}
        {currentStep === 'preview' && mvpContent && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Preview Your Link-in-Bio Page</h2>
            
            {mvpContent ? (
              <div className="space-y-8">
                {/* Display theme preview component based on selected theme */}
                {mvpContent && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Preview: {getTheme(formState.themeId)?.meta.name}</h3>
                    <div className="mt-4 border border-gray-200 rounded-lg p-4">
                      {(() => {
                        const theme = getTheme(formState.themeId);
                        if (!theme) return (
                          <p className="text-gray-500 text-center py-10">Theme not found</p>
                        );
                        
                        const PreviewComponent = theme.previewComponent;
                        return <PreviewComponent data={mvpContent} />;
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Configuration section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generated {getTheme(formState.themeId)?.meta.id === 'lynx' ? 'TOML configuration' : 'HTML/CSS'} for your link-in-bio page. 
                    Copy this to deploy your site or download the generated files.
                  </p>
                  {/* Render the configuration for the selected theme */}
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs whitespace-pre border border-gray-200">
                      {getTheme(formState.themeId)?.generator ? 
                        getTheme(formState.themeId)!.generator(mvpContent).content : 
                        'Theme generator not available'}
                    </pre>
                    <button
                      onClick={handleCopyConfig}
                      className="mt-4 px-6 py-2 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-70 transition-colors duration-150"
                    >
                      {copied ? 'Copied!' : 'Copy Configuration (TOML)'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between pt-6 mt-6 border-t border-gray-200 gap-4">
                  <button 
                    type="button"
                    onClick={() => setCurrentStep('theme')} 
                    className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                  >
                    ← Back to Themes
                  </button>
                  <div className="flex flex-col items-end gap-2">
                    {!formState.themeId && (
                      <p className="text-sm text-amber-600">
                        ⚠️ Please select a theme to continue
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleProceedToPreview}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        formState.themeId
                          ? 'bg-primary text-white hover:bg-primary-dark' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!formState.themeId}
                    >
                      Continue to Preview
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 text-lg mb-4">No content to display. Something went wrong during generation.</p>
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Deploy */}
        {currentStep === 'deploy' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Deploy Your Portfolio</h2>
            
            {/* Debug info for troubleshooting */}
            <div className="hidden">
              <pre className="text-xs text-gray-500 mb-4">
                {JSON.stringify({
                  installationId: formState.installationId,
                  userLogin: formState.userLogin, 
                  repoName: formState.repoName,
                  selectedRepo: selectedRepoFullName
                }, null, 2)}
              </pre>
            </div>
            
            {/* Show GitHub App installation success message */}
            {githubInstallSuccess && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-lg leading-5 text-green-800 font-medium">
                      GitHub App Installed Successfully!
                    </p>
                    <p className="text-sm leading-5 text-green-700 mt-1">
                      Your GitHub App has been connected. You can now deploy your portfolio site.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show deployment error if any */}
            {deploymentError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 font-medium">Error connecting to GitHub:</p>
                <p className="text-sm text-red-500">{deploymentError}</p>
              </div>
            )}
            {deploymentSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 font-medium">Deployment Successful!</p>
                    <p className="text-sm text-green-500 whitespace-pre-wrap">{deploymentSuccess}</p>
                </div>
            )}
            
            {/* GitHub App Installation status and Deployment Form */}
            {!formState.installationId ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">
                  Install the Quickfolio GitHub App to deploy your new portfolio site.
                </p>
                <RepoSelector 
                  onRepoSelected={handleRepoSelected} 
                  githubUsername={formState.userLogin} 
                />
                {selectedRepoFullName && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 mb-3">
                      You&apos;ve selected: <strong className="text-indigo-600">{selectedRepoFullName}</strong>.
                      Now, install the Quickfolio GitHub App for this repository.
                    </p>
                    <button
                      onClick={handleInstallApp}
                      type="button"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-.916-1.466-.916-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.201 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd"></path></svg>
                      Install Quickfolio GitHub App for {selectedRepoFullName}
                    </button>
                  </div>
                )}
                {!selectedRepoFullName && formState.userLogin && (
                  <p className="mt-6 text-center text-gray-500">
                    Please select or create a repository above to proceed with the app installation.
                  </p>
                )}

              </div>
            ) : (
              <div>
                {/* Add choice for users to continue with existing data or start fresh */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Previous installation detected</h3>
                  <p className="text-blue-700 mb-3">
                    We found a previous GitHub App installation (ID: <strong>{formState.installationId}</strong>)
                    {selectedRepoFullName && <span> for repository: <strong>{selectedRepoFullName}</strong></span>}.
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      onClick={async () => {
                        // Continue with existing installation and deploy
                        console.log('Continuing with existing GitHub App installation...');
                        await handleDeploy();
                      }}
                    >
                      Continue with this setup
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        // Clear all GitHub-related data
                        setFormState(prev => ({ ...prev, installationId: null }));
                        setSelectedRepoFullName(null);
                        setGithubRepoId(null);
                        localStorage.removeItem('github_installation_id');
                        localStorage.removeItem('selected_repo_full_name');
                        localStorage.removeItem('github_repo_id');
                      }}
                    >
                      Start fresh with new repository
                    </button>
                  </div>
                </div>

                {/* Deployment form when app is installed */} 
                <div className="mb-6">
                  <p className="text-gray-700 mb-1">
                    The Quickfolio GitHub App is installed (Installation ID: <strong className="text-indigo-600">{formState.installationId}</strong>).
                  </p>
                  {selectedRepoFullName ? (
                     <p className="text-gray-700 mb-4">
                       Target repository: <strong className="text-indigo-600">{selectedRepoFullName}</strong>.
                     </p>
                  ) : (
                    <div className="mt-4">
                      <p className="text-gray-600 mb-3">Please select a repository for deployment:</p>
                      <RepoSelector 
                        onRepoSelected={handleRepoSelected} 
                        githubUsername={formState.userLogin} 
                      />
                    </div>
                  )}
                  {!selectedRepoFullName && formState.repoName && (
                     <p className="text-gray-700 mb-4">
                       Target repository from previous session: <strong className="text-indigo-600">{formState.userLogin}/{formState.repoName}</strong>. Consider re-selecting if this is not intended.
                     </p>
                  )}
                  <p className="text-gray-700 mb-4">
                    Fill in the details below to deploy your portfolio.
                  </p>
                  
                  {/* GitHub Username (display or confirm, as it's part of selectedRepoFullName) */}
                  {/* We might not need a separate input for repoName if selectedRepoFullName is canonical */}
                  {/* For now, keeping the structure, but repoName in formState should be derived from selectedRepoFullName */}

                  {/* Conditionally show RepoSelector if no repo selected yet OR to allow change */} 
                  {(!selectedRepoFullName && formState.userLogin) && (
                    <div className="mb-6">
                       <p className="text-sm text-gray-600 mb-2">It seems a repository was not selected in this session. Please select one:</p>
                       <RepoSelector 
                        onRepoSelected={handleRepoSelected} 
                        githubUsername={formState.userLogin} 
                      />
                    </div>
                  )}
                  
                  {/* Portfolio description input - this is fine */}
                  <div className="mb-4">
                    <label htmlFor="portfolioDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Portfolio Description
                    </label>
                    <input
                      type="text"
                      id="portfolioDescription"
                      name="portfolioDescription"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      value={formState.portfolioDescription}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Description for your new portfolio repository.
                    </p>
                  </div>
                  
                  {/* Private repository toggle */}
                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="isPrivateRepo"
                      name="isPrivateRepo"
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
                      checked={formState.isPrivateRepo}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isPrivateRepo" className="text-sm font-medium text-gray-700">
                      Make Repository Private
                    </label>
                  </div>
                  
                  {/* Deploy button */} 
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying || !formState.userLogin || !selectedRepoFullName || !formState.installationId}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-md disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeploying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deploying...
                      </>
                    ) : 'Deploy to GitHub Pages'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-2 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Back to Preview
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Create;
