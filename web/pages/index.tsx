import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import WaitlistForm from '../components/WaitlistForm';

const Home: NextPage = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleWaitlistSubmit = async (email: string) => {
    // In a real implementation, this would submit to an API
    console.log('Waitlist signup:', email);
    setShowSuccess(true);
    
    // Reset after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Quickfolio | Resume to Portfolio in Minutes</title>
        <meta name="description" content="Transform your resume into a professional portfolio website in minutes with AI-powered Quickfolio." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main className="flex-grow">
        <HeroSection onWaitlistSubmit={handleWaitlistSubmit} showSuccess={showSuccess} />
        <FeaturesSection />
        <HowItWorksSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
