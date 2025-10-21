import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Simbly-logo copy.jpg';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { label: 'Home', href: 'hero' },
    { label: 'How it Works', href: 'how-it-works' },
    { label: 'Benefits', href: 'benefits' },
    { label: 'Pricing', href: 'pricing' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Simbly.ai" className="h-12 w-auto" />
          </div>

          <div className="hidden md:flex items-center justify-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="px-5 py-2.5 rounded-full bg-gray-50 text-gray-700 font-medium hover:bg-primary hover:text-white transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(30,90,125,0.25)] hover:scale-105"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="text-sm text-gray-600">
                  Welcome, {user?.email}
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 rounded-full bg-white text-primary font-semibold border-2 border-primary hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-all duration-200 hover:scale-105"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 rounded-full bg-white text-primary font-semibold border-2 border-primary hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Login
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="px-7 py-3 rounded-full bg-primary text-white font-semibold shadow-[0_4px_16px_rgba(30,90,125,0.3)] hover:shadow-[0_6px_24px_rgba(30,90,125,0.4)] transition-all duration-200 hover:scale-105 hover:bg-[#174864]"
                >
                  Book a Demo
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="block w-full px-6 py-3 rounded-full bg-gray-50 text-gray-700 font-medium hover:bg-primary hover:text-white transition-all duration-200 shadow-md text-left"
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="block w-full px-6 py-3 rounded-full bg-white text-primary font-semibold border-2 border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-md text-left"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-6 py-3 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-all duration-200 shadow-md text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="block w-full px-6 py-3 rounded-full bg-white text-primary font-semibold border-2 border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-md text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="block w-full px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-lg"
                >
                  Book a Demo
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
