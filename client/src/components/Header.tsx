import { useState } from "react";
import { Link } from "wouter";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
            <path d="M12 2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5zM17 13c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5z"></path>
          </svg>
          <h1 className="font-heading font-bold text-xl md:text-2xl">GraphViz</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className="font-medium text-gray-700 hover:text-primary transition-colors">
              Home
            </a>
          </Link>
          <Link href="/documentation">
            <a className="font-medium text-gray-700 hover:text-primary transition-colors">
              Documentation
            </a>
          </Link>
          <Link href="/examples">
            <a className="font-medium text-gray-700 hover:text-primary transition-colors">
              Examples
            </a>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button 
            className="hidden md:block bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            onClick={() => document.dispatchEvent(new CustomEvent('saveGraph'))}
          >
            Save Graph
          </button>
          <button 
            className="md:hidden text-gray-700"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-6 h-6"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {isMenuOpen && <MobileMenu onClose={() => setIsMenuOpen(false)} />}
    </header>
  );
}
