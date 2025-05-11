import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Upload Your Resume',
    description: 'Simply upload your existing resume PDF or connect your LinkedIn profile.',
    imageUrl: '/images/upload-resume.svg',
  },
  {
    number: '02',
    title: 'AI Enhancement',
    description: 'Our AI transforms your resume data into compelling portfolio content.',
    imageUrl: '/images/ai-enhancement.svg',
  },
  {
    number: '03',
    title: 'Choose Your Theme',
    description: 'Select from professionally designed themes that match your style.',
    imageUrl: '/images/choose-theme.svg',
  },
  {
    number: '04',
    title: 'Deploy to GitHub',
    description: 'With one click, deploy your portfolio to your own GitHub repository.',
    imageUrl: '/images/deploy-github.svg',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From resume to professional portfolio in four simple steps.
            No coding required.
          </p>
        </div>
        
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center`}
            >
              {/* Content */}
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className={`md:${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                  <div className="inline-block bg-primary text-white text-lg font-semibold px-4 py-2 rounded-md mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
              </div>
              
              {/* Image placeholder */}
              <div className="md:w-1/2">
                <div className="bg-white rounded-lg shadow-md p-6 h-64 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">Image placeholder for</p>
                    <p className="font-semibold">{step.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href="#waitlist" 
            className="bg-primary hover:bg-secondary text-white font-medium py-3 px-8 rounded-md transition-colors inline-block"
          >
            Join the Waitlist
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
