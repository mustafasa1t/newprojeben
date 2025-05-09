import { Link } from "wouter";

interface MobileMenuProps {
  onClose: () => void;
}

export default function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <div className="bg-white shadow-lg p-4 md:hidden">
      <nav className="flex flex-col space-y-4">
        <Link href="/">
          <a 
            className="font-medium text-gray-700 hover:text-primary transition-colors py-2"
            onClick={onClose}
          >
            Home
          </a>
        </Link>
        <Link href="/documentation">
          <a 
            className="font-medium text-gray-700 hover:text-primary transition-colors py-2"
            onClick={onClose}
          >
            Documentation
          </a>
        </Link>
        <Link href="/examples">
          <a 
            className="font-medium text-gray-700 hover:text-primary transition-colors py-2"
            onClick={onClose}
          >
            Examples
          </a>
        </Link>
        <button 
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => {
            alert("Save Graph functionality to be implemented");
            onClose();
          }}
        >
          Save Graph
        </button>
      </nav>
    </div>
  );
}
