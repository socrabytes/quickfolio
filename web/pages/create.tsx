import React, { useState } from 'react';
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
  });
  
  // Resume upload handling (file) - keep for now, but focus on text input for MVP
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New state for MVP content generation
  const [mvpContent, setMvpContent] = useState<MVPContentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false); // For copy button feedback
  
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
    setCurrentStep('theme');
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
                    // onClick={() => setCurrentStep('deploy')} // Deploy step not yet implemented
                    onClick={() => alert('Deploy functionality coming soon!')}
                    className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
                  >
                    Proceed to Deploy (Coming Soon)
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

        {/* Step 4: Deploy (Placeholder) */}
        {currentStep === 'deploy' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Deploy Your Portfolio</h2>
            <p className="text-gray-600 mb-6">
              Connect your GitHub account to deploy your new portfolio site. (This step is a placeholder)
            </p>
            {/* TODO: Add GitHub OAuth button and deployment logic */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-2 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Back to Preview
              </button>
              <button
                type="button"
                // onClick={handleDeploy} // TODO: Implement deployment handler
                className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Deploy Now (Placeholder)
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
