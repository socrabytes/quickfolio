import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Define step types for the portfolio creation wizard
type CreationStep = 'upload' | 'customize' | 'preview' | 'deploy';

// Interface for form state
interface FormState {
  resumeFile: File | null;
  tone: string;
  theme: string;
}

const Create: NextPage = () => {
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<CreationStep>('upload');
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    resumeFile: null,
    tone: 'professional',
    theme: 'minimal',
  });
  
  // Resume upload handling
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Validate file is PDF
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
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
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.resumeFile) {
      setUploadError('Please select a resume file');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // In a real implementation, this would upload to the API
      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Move to next step after successful upload
      setCurrentStep('customize');
    } catch (error) {
      setUploadError('Error uploading file. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Create Your Portfolio | Quickfolio</title>
        <meta name="description" content="Create your professional portfolio with Quickfolio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Portfolio</h1>
          
          {/* Progress indicator */}
          <div className="mt-6 flex justify-between">
            {['upload', 'customize', 'preview', 'deploy'].map((step) => (
              <div 
                key={step} 
                className={`flex-1 border-t-4 pt-4 ${
                  currentStep === step 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-gray-200 text-gray-400'
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
            <h2 className="text-2xl font-semibold mb-6">Upload Your Resume</h2>
            <p className="text-gray-600 mb-6">
              Upload your PDF resume and we'll extract your information to create a personalized portfolio site.
            </p>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <svg 
                      className="w-12 h-12 text-gray-400 mb-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <span className="text-base font-medium text-gray-900">
                      Click to upload your resume
                    </span>
                    <span className="text-sm text-gray-500">
                      PDF format only, max 10MB
                    </span>
                  </label>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg 
                      className="w-12 h-12 text-green-500 mb-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    <span className="text-base font-medium text-gray-900">
                      {formState.resumeFile.name}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setFormState({ ...formState, resumeFile: null })}
                      className="text-sm text-red-500 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              {uploadError && (
                <div className="text-red-500 text-sm">{uploadError}</div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!formState.resumeFile || isUploading}
                  className={`px-6 py-2 rounded-md font-medium ${
                    !formState.resumeFile || isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Step 2: Customization (to be implemented next) */}
        {currentStep === 'customize' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Customize Your Portfolio</h2>
            <p className="text-gray-600 mb-6">
              Resume uploaded successfully! Next, customize how your portfolio will look.
            </p>
            
            {/* Placeholder for customization options */}
            <div className="py-8 text-center text-gray-500">
              <p>Customization options will be implemented in the next phase</p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-6 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              
              <button
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Preview (to be implemented next) */}
        {currentStep === 'preview' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Preview Your Portfolio</h2>
            
            {/* Placeholder for preview iframe */}
            <div className="border border-gray-300 rounded-lg h-96 flex items-center justify-center text-gray-500">
              Portfolio preview will be implemented in the next phase
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('customize')}
                className="px-6 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              
              <button
                onClick={() => setCurrentStep('deploy')}
                className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Deploy (to be implemented next) */}
        {currentStep === 'deploy' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Deploy Your Portfolio</h2>
            
            <div className="text-center py-12">
              <button
                className="px-8 py-3 rounded-md font-medium bg-[#2da44e] text-white hover:bg-[#2c974b] flex items-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Connect with GitHub
              </button>
              
              <p className="text-gray-500 mt-4">
                You'll be redirected to GitHub to authorize Quickfolio
              </p>
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
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
