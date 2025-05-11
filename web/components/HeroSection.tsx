import React from 'react';
import Link from 'next/link';
import WaitlistForm from './WaitlistForm';

interface HeroSectionProps {
  onWaitlistSubmit: (email: string) => void;
  showSuccess: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onWaitlistSubmit, showSuccess }) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left column: Text content */}
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Own your site, own your brand, <span className="text-primary">zero lock-in.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Transform your resume into a professional portfolio site in under 2 minutes.
              AI-powered, GitHub-hosted, and completely yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/create" 
                className="bg-primary hover:bg-secondary text-white font-medium py-3 px-6 rounded-md transition-colors text-center"
              >
                Create Portfolio
              </Link>
              <a 
                href="#how-it-works" 
                className="bg-white border border-primary text-primary hover:bg-gray-50 font-medium py-3 px-6 rounded-md transition-colors text-center"
              >
                See How It Works
              </a>
              <a 
                href="#waitlist" 
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-md transition-colors text-center"
              >
                Join Waitlist
              </a>
            </div>
          </div>
          
          {/* Right column: Image or form */}
          <div className="md:w-1/2 md:pl-8">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Join the Waitlist</h2>
                <p className="text-gray-600">
                  Be the first to know when Quickfolio launches. Early access members get premium features free for 3 months.
                </p>
              </div>
              
              <WaitlistForm onSubmit={onWaitlistSubmit} showSuccess={showSuccess} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
