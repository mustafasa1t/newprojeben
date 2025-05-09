import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="currentColor">
                <path d="M12 2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5zM17 13c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5z"></path>
              </svg>
              <span className="font-heading font-bold text-lg text-white">GraphViz</span>
            </div>
            <p className="text-sm mt-1">Interactive Graph Algorithm Visualization</p>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-12 space-y-4 md:space-y-0 items-center md:items-start">
            <div>
              <h3 className="font-heading font-medium text-white mb-2">Resources</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/documentation">
                    <a className="hover:text-primary transition-colors">Documentation</a>
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials">
                    <a className="hover:text-primary transition-colors">Tutorials</a>
                  </Link>
                </li>
                <li>
                  <Link href="/examples">
                    <a className="hover:text-primary transition-colors">Examples</a>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-medium text-white mb-2">About</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/team">
                    <a className="hover:text-primary transition-colors">Team</a>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <a className="hover:text-primary transition-colors">Contact</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-center">
          <p>© {new Date().getFullYear()} GraphViz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
