import React, { useState } from 'react';
import Link from 'next/link';

const Header = (): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">🚀 Quickfolio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-text hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-text hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/create" className="text-text hover:text-primary transition-colors font-medium">
              Create Portfolio
            </Link>
            <Link href="#waitlist" className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md transition-colors">
              Join Waitlist
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-text"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-4">
            <div onClick={() => setIsMenuOpen(false)}>
              <Link 
                href="#features" 
                className="block text-text hover:text-primary transition-colors"
              >
                Features
              </Link>
            </div>
            <div onClick={() => setIsMenuOpen(false)}>
              <Link 
                href="#how-it-works" 
                className="block text-text hover:text-primary transition-colors"
              >
                How It Works
              </Link>
            </div>
            <div onClick={() => setIsMenuOpen(false)}>
              <Link 
                href="/create" 
                className="block text-text hover:text-primary transition-colors font-medium"
              >
                Create Portfolio
              </Link>
            </div>
            <div onClick={() => setIsMenuOpen(false)}>
              <Link 
                href="#waitlist" 
                className="block bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md transition-colors w-full text-center"
              >
                Join Waitlist
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
