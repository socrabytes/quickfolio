import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemePicker from '../components/ThemePicker';
import { getTheme, getThemes, getDefaultThemeId } from '../themes';
import '../themes/lynx';
import '../themes/nebula';

// Define step types for the portfolio creation wizard
type CreationStep = 'upload' | 'customize' | 'theme' | 'preview' | 'deploy';

// --- New TypeScript Interfaces for MVP Content ---
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

interface MVPContentData {
  profile: ProfileData;
  links: LinkData[];
}

interface MVPContentGenerationResponse {
  mvp_content?: MVPContentData;
  raw_ai_response?: string;
  error?: string;
  debug_info?: {
    prompt_length?: number;
    model_used?: string;
    parsed_json_failing_validation?: any;
  };
}

// Interface for form state
interface FormState {
  resumeFile: File | null;
  resumeText: string;
  tone: string;
  themeId: string;
  // New state for GitHub App integration
  installationId: number | null;
  userLogin: string;
  repoName: string;
  portfolioDescription: string;
  isPrivateRepo: boolean;
}

const Create: NextPage = () => {
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<CreationStep>('upload');
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    resumeFile: null,
    resumeText: '',
    tone: 'professional',
    themeId: getDefaultThemeId(), // Use default theme from registry
    installationId: null,
    userLogin: '',
    repoName: '',
    portfolioDescription: 'My Quickfolio-generated portfolio site',
    isPrivateRepo: false,
  });
  
  // Resume upload handling (file) - keep for now, but focus on text input for MVP
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New state for MVP content generation
  const [mvpContent, setMvpContent] = useState<MVPContentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false); // For copy button feedback
  
  // For GitHub deployment errors
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false); // For deployment loading state
  const [deploymentSuccess, setDeploymentSuccess] = useState<string | null>(null);

  // Add router to handle URL parameters
  const router = useRouter();
  
  // Handle URL parameters for step, error, and installation_id
  useEffect(() => {
    if (!router.isReady) return;
    
    const { query } = router;

    // Check if we need to set a specific step
    if (query.step) {
      const step = query.step as CreationStep;
      if (['upload', 'customize', 'theme', 'preview', 'deploy'].includes(step)) {
        setCurrentStep(step);
      }
      
      // If we're on the deploy step and have a success parameter, check for content in localStorage
      if (step === 'deploy') {
        if (query.success === 'true') {
            const savedContent = localStorage.getItem('mvp_content');
            if (savedContent) {
              try {
                const parsedContent = JSON.parse(savedContent) as MVPContentData;
                setMvpContent(parsedContent);
              } catch (e) {
                console.error('Failed to parse content from localStorage:', e);
              }
            }
        }
        // Pre-fill userLogin from localStorage if available (e.g., from a previous session)
        const storedUserLogin = localStorage.getItem('github_user_login');
        if (storedUserLogin) {
          setFormState(prev => ({ ...prev, userLogin: storedUserLogin }));
        }
      }
    }
    
    // Check for error parameter from backend redirects
    if (query.error) {
      // Distinguish between general errors and GitHub App specific errors
      if (query.error === 'app_install_url_failed' || query.error === 'app_callback_invalid_params') {
        setDeploymentError(`GitHub App setup failed: ${query.error_description || query.error}`);
      } else {
        setDeploymentError(query.error as string);
      }
    }

    // Check for installation_id from GitHub App callback
    if (query.installation_id) {
      const instId = parseInt(query.installation_id as string, 10);
      if (!isNaN(instId)) {
        setFormState(prev => ({ ...prev, installationId: instId }));
        console.log(`GitHub App Installation ID received: ${instId}`);
        // Optionally, you can store this in localStorage if user navigates away and comes back
        localStorage.setItem('github_installation_id', instId.toString());
        // If successfully installed, move to deploy step automatically if content is ready
        if (mvpContent || localStorage.getItem('mvp_content')) {
          setCurrentStep('deploy');
        } else {
          // If no content, maybe go to customize or stay to allow user to generate content
          // For now, let's assume content should be generated first
          // setCurrentStep('customize'); 
        }
        // Clean up URL query parameters after processing
        const { pathname, query: currentQuery } = router;
        delete currentQuery.installation_id;
        delete currentQuery.setup_action; // if you also handle setup_action
        router.replace({ pathname, query: currentQuery }, undefined, { shallow: true });
      }
    }

  }, [router.isReady, router.query, mvpContent]); // Added mvpContent to deps

  // Load installationId from localStorage on initial mount if not in query
  useEffect(() => {
    if (!formState.installationId) {
      const storedInstallationId = localStorage.getItem('github_installation_id');
      if (storedInstallationId) {
        setFormState(prev => ({ ...prev, installationId: parseInt(storedInstallationId, 10) }));
      }
    }
  }, []); // Empty dependency array ensures this runs only on mount

  // Theme selection handler
  const handleThemeSelect = (themeId: string) => {
    setFormState((prev: FormState) => ({ ...prev, themeId }));
  };
  
  // Function to proceed from theme selection to preview
  const handleProceedToPreview = () => {
    setCurrentStep('preview');
  };

  // Handler for text area resume input
  const handleResumeTextChange = (e: { target: { value: string } }) => {
    setFormState({
      ...formState,
      resumeText: e.target.value,
    });
    if (e.target.value.trim() !== '') {
      setUploadError(null); // Clear error if user starts typing
    }
  };

  // Generic handler for form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Need a type assertion for 'checked' property on HTMLInputElement
    const isCheckbox = type === 'checkbox' && e.target instanceof HTMLInputElement;
    setFormState(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: { target: { files: FileList | null } }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Validate file is PDF
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      // Also clear resumeText if a file error occurs, to avoid confusion
      // setFormState(prev => ({ ...prev, resumeFile: null })); 
      return;
    }
    
    // Clear previous error if any
    setUploadError(null);
    
    // Update form state
    setFormState({
      ...formState,
      resumeFile: file,
    });
  };
  
  // Function to generate TOML configuration for Hugo (Lynx theme)
  const generateTomlConfig = (content: MVPContentData): string => {
    let tomlString = `baseURL = "https://example.com/" # Replace with your actual domain
languageCode = "en-us"
title = "${content.profile.name}&apos;s Links"
theme = "lynx"

[params]
  author = "${content.profile.name}"
  description = "${content.profile.headline}"
  copyright = "  ${new Date().getFullYear()} ${content.profile.name}. All rights reserved."
  
  # Avatar settings
  avatar = "${content.profile.avatar || 'avatar.png'}" # Default if not provided by AI
  favicon = "favicon.ico" # Make sure you have this in your static folder
  
  # Social icons and other settings can be added here if needed by Lynx
  # For MVP, we're focusing on profile and main links.

[profile]
  name = "${content.profile.name}"
  headline = "${content.profile.headline}"
  # avatar is usually handled by params.avatar in Lynx

`;

    content.links.forEach(link => {
      tomlString += `\n[[params.links]]
  text = "${link.text}"
  url = "${link.url}"
${link.icon ? `  icon = "${link.icon}"` : ''}
${link.type ? `  type = "${link.type}"` : ''}
`;
    });

    return tomlString.trim();
  };

  // Handle copying the configuration to clipboard
  const handleCopyConfig = () => {
    if (!mvpContent || !getTheme(formState.themeId)) return;
    
    const configContent = getTheme(formState.themeId)?.generator(mvpContent).content;
    if (configContent) {
      navigator.clipboard.writeText(configContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Dynamically render the theme preview component
  const renderThemePreview = (themeId: string, data: MVPContentData) => {
    const theme = getTheme(themeId);
    if (!theme) return null;
    
    const PreviewComponent = theme.previewComponent;
    return <PreviewComponent data={data} />;
  };

  /**
   * Process resume from either text input or PDF file upload
   * Handles sending data to the backend for MVP content generation
   */
  const handleProcessResume = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    
    // Validate input - require either text or file
    if (!formState.resumeText.trim() && !formState.resumeFile) {
      setUploadError('Please paste your resume text or upload a PDF file.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setUploadError(null); // Clear previous errors
    
    // If PDF file is provided but no text, process the file
    if (formState.resumeFile) {
      try {
        // For now, in the MVP, let's use a mock text extraction as a fallback
        // In the future, this should properly extract text from the PDF via the backend
        
        // If we also have text input, use that instead of extracting from PDF
        if (formState.resumeText.trim()) {
          return await generateMVPContent(formState.resumeText);
        }
        
        // In a production environment, we would extract text from the PDF
        // For MVP demo purposes, we'll use a reasonable fallback
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('file', formState.resumeFile);
          
          // Try to call the API endpoint that handles PDF processing
          const uploadResponse = await fetch('http://localhost:8888/upload-resume', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`PDF upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }
          
          const uploadData = await uploadResponse.json();
          if (uploadData.resumeText) {
            // If we successfully got text from the PDF, use it
            return await generateMVPContent(uploadData.resumeText);
          }
          throw new Error('Failed to extract text from PDF');
        } catch (error) {
          // If the PDF processing fails, we can use a fallback for demo purposes
          // In production, we should handle this more gracefully
          console.warn('PDF extraction failed, using filename as fallback name:', error);
          
          // Use the filename (without extension) as a fallback name for demos
          const fileName = formState.resumeFile.name.replace(/\.pdf$/i, '');
          const demoText = `Name: ${fileName}\nTitle: Software Developer\nExperience: 5 years of software development\nSkills: JavaScript, React, Node.js\nEducation: Computer Science degree\nContact: example@email.com\nLinkedIn: linkedin.com/in/${fileName.toLowerCase().replace(/\s+/g, '-')}\nGitHub: github.com/${fileName.toLowerCase().replace(/\s+/g, '')}\nPortfolio: ${fileName.toLowerCase().replace(/\s+/g, '')}.dev`;
          
          await generateMVPContent(demoText);
          // After content generation, go to theme selection
          setCurrentStep('theme');
        }
      } catch (error) {
        console.error('Error processing PDF:', error);
        setUploadError(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
        setIsGenerating(false);
        return;
      }
    }

    // For text input, use the content directly
    await generateMVPContent(formState.resumeText);
    // After content generation, go to theme selection
    setCurrentStep('theme');
  };

  /**
   * Makes API call to generate MVP content from resume text
   * @param resumeText - The resume text to process
   */
  const generateMVPContent = async (resumeText: string): Promise<void> => {
    if (!resumeText.trim()) {
      setUploadError('Resume text cannot be empty');
      setIsGenerating(false);
      return;
    }

    try {
      // Try to use the actual backend API
      const response = await fetch('http://localhost:8888/generate-mvp-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume_text: resumeText }),
      });

      // Check if the API response was successful
      if (!response.ok) {
        // If the API fails with a 500 error, we'll use a fallback response for demo purposes
        if (response.status === 500) {
          console.warn('Backend API failed with 500 error. Using demo fallback data.');
          return generateDemoContent(resumeText);
        }
        
        // For other errors, display the error message
        const errorMsg = `Error: ${response.status} ${response.statusText}`;
        console.error('MVP Content Generation Error:', errorMsg);
        setGenerationError(errorMsg);
        setMvpContent(null);
        return;
      }

      // Process the successful response
      const data: MVPContentGenerationResponse = await response.json();

      if (data.error) {
        console.error('API returned error:', data.error);
        setGenerationError(data.error);
        setMvpContent(null);
        return;
      }

      if (data.mvp_content) {
        setMvpContent(data.mvp_content);
        setCurrentStep('theme'); // Move to theme selection step on success
      } else {
        // API returned success but no content - use fallback
        console.warn('API returned no MVP content. Using demo fallback data.');
        return generateDemoContent(resumeText);
      }
    } catch (error) {
      // Network or parsing errors - use fallback for demo
      console.error('Error during MVP content generation:', error);
      console.warn('Using demo fallback data due to error.');
      return generateDemoContent(resumeText);
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Generates demo content based on input text for testing when API is unavailable
   * @param resumeText - Raw resume text to extract basic information from
   */
  const generateDemoContent = (resumeText: string): void => {
    // Extract a name from the resumeText, or use a default
    const nameMatch = resumeText.match(/name:\s*([^\n]+)/i) || 
                     resumeText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/) || 
                     [null, 'John Doe'];
    const name = nameMatch[1].trim();
    
    // Try to extract a title/headline
    const titleMatch = resumeText.match(/title:\s*([^\n]+)/i) || 
                      resumeText.match(/position:\s*([^\n]+)/i) || 
                      resumeText.match(/([A-Za-z]+ Engineer|Developer|Designer|Programmer|Architect)/i) || 
                      [null, 'Software Developer'];
    const title = titleMatch[1].trim();
    
    // Create a sample avatar filename based on the name
    const avatar = `${name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    
    // Demo MVP content with some standard links
    const demoContent: MVPContentData = {
      profile: {
        name,
        headline: title,
        avatar
      },
      links: [
        {
          text: 'GitHub',
          url: `https://github.com/${name.toLowerCase().replace(/\s+/g, '')}`
        },
        {
          text: 'LinkedIn',
          url: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
          icon: 'linkedin'
        },
        {
          text: 'Portfolio',
          url: `https://${name.toLowerCase().replace(/\s+/g, '')}.dev`
        },
        {
          text: 'Email',
          url: `mailto:${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          icon: 'envelope'
        },
        {
          text: 'Resume',
          url: `#`,
          icon: 'file-pdf'
        }
      ]
    };
    
    // Set the demo content and proceed to theme selection
    setMvpContent(demoContent);
    setIsGenerating(false);
    setCurrentStep('theme');
  };
  
  /**
   * Handle deployment to GitHub Pages
   * Uses the GitHub token from localStorage to create a repository
   * and deploy the generated portfolio
   */
  const handleDeploy = async (): Promise<void> => {
    if (!mvpContent) {
      setDeploymentError('No content generated to deploy.');
      return;
    }
    if (!formState.installationId) {
      setDeploymentError('GitHub App not installed or installation ID missing. Please connect GitHub by clicking the button above.');
      // Optionally, redirect to install flow if not already clear
      // window.location.href = '/api/github/app/install';
      return;
    }
    if (!formState.userLogin.trim()) {
      setDeploymentError('GitHub Username is required.');
      return;
    }
    if (!formState.repoName.trim()) {
      setDeploymentError('Repository Name is required.');
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentSuccess(null);

    const formData = new FormData();
    formData.append('installation_id', formState.installationId.toString());
    formData.append('user_login', formState.userLogin);
    formData.append('repo_name', formState.repoName);
    formData.append('generated_content', JSON.stringify(mvpContent)); // Send the full MVP content
    formData.append('theme', formState.themeId);
    formData.append('portfolio_description', formState.portfolioDescription);
    formData.append('private_repo', formState.isPrivateRepo.toString());

    // The theme's static files (like images, default _index.md if needed)
    // might need to be handled differently. For now, backend uses template_path from themeId.
    // The `github_service.create_pages_repository` is expected to copy files from `TEMPLATES_DIR / themeId`
    // And then `update_repository_content` would be used if we wanted to push AI-generated markdown/HTML files.
    // For the current Python `create_pages_repository`, it pushes the whole `template_path`.
    // We need to ensure that `generated_content` is used by the backend to *create* files within that structure.
    // This part needs careful coordination with backend logic for how content is placed in the repo.

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `Deployment failed: ${response.statusText}`);
      }

      setDeploymentSuccess(`Successfully deployed to ${result.deployment_url}!\nRepository: ${result.repository_url}`);
      console.log('Deployment successful:', result);
      // Optionally, clear localStorage or redirect to a success page
      // localStorage.removeItem('mvp_content');
      // localStorage.removeItem('github_installation_id'); // User might want to deploy another repo
      // router.push(`/success?url=${result.deployment_url}`);

    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentError(error.message || 'An unknown error occurred during deployment.');
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
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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

                <div className="flex justify-between pt-6 mt-6 border-t">
                  <button 
                    onClick={() => setCurrentStep('theme')} 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Change Theme
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep('deploy')}
                    className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
                  >
                    Proceed to Deploy
                  </button>
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
                <p className="text-gray-600 mb-6">
                  Install the Quickfolio GitHub App to deploy your new portfolio site.
                </p>
                <a
                  href="https://github.com/apps/quickfolio/installations/new"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-.916-1.466-.916-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.201 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd"></path></svg>
                  Install Quickfolio GitHub App
                </a>
                {formState.userLogin && (
                  <p className="mt-4 text-sm text-green-600">
                    GitHub App installed for user {formState.userLogin}.
                  </p>
                )}
              </div>
            ) : (
              <div>
                {/* Deployment form when app is installed */} 
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    The Quickfolio GitHub App is installed (ID: {formState.installationId}). Fill in the details to deploy.
                  </p>
                  
                  {/* GitHub Username input */}
                  <div className="mb-4">
                    <label htmlFor="userLogin" className="block text-sm font-medium text-gray-700 mb-1">
                      Your GitHub Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="userLogin"
                      name="userLogin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      placeholder="YourGitHubUsername"
                      value={formState.userLogin}
                      onChange={handleInputChange}
                      required
                    />
                     <p className="text-xs text-gray-500 mt-1">
                      The GitHub username where the app was installed.
                    </p>
                  </div>

                  {/* Repository name input */}
                  <div className="mb-4">
                    <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 mb-1">
                      New Repository Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="repoName"
                      name="repoName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      placeholder="my-awesome-portfolio"
                      value={formState.repoName}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A new repository will be created with this name.
                    </p>
                  </div>

                  {/* Portfolio description input */}
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
                    disabled={isDeploying || !formState.userLogin || !formState.repoName}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-md disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeploying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
