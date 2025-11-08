import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoStatic from '../assets/Logo without tagline.svg';
import logoAnimated from '../assets/SimblyAI Logo-animated.mp4';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
      // Detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'how-it-works', 'benefits', 'pricing'];
      const scrollPos = window.scrollY + 150; // offset for nav height

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navItems = [
    { label: 'Home', href: 'hero' },
    { label: 'How it Works', href: 'how-it-works' },
    { label: 'Benefits', href: 'benefits' },
    { label: 'Pricing', href: 'pricing' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 100; // Approximate height of fixed nav (logo h-20 = 80px + padding)
      const offset = navHeight + 20; // Additional padding below nav
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f6f6f4]/50 backdrop-blur supports-[backdrop-filter]:bg-[#f6f6f4]/30 border-b border-black/5">
    <div className="max-w-7xl mx-auto px-6 py-2">
    <div className="flex items-center justify-between">
      {/* Left: logo */}
      <div 
        className="flex items-center gap-2"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
      >
        {!isLogoHovered && (
          <img 
            src={logoStatic} 
            alt="Simbly.ai" 
            className="h-20 w-auto transition-opacity duration-200" 
          />
        )}
        {isLogoHovered && (
          <video
            src={logoAnimated}
            className="h-20 w-auto"
            autoPlay
            loop
            muted
            playsInline
          />
        )}
      </div>

      {/* Center: desktop links with animated underline */}
      <div className="hidden md:flex items-center gap-6">
      {navItems.map((item) => {
          const isActive = activeSection === item.href;
          return (
            <button
              key={item.href}
              onClick={() => scrollToSection(item.href)}
              className={`relative group text-[#0c537e] tracking-tight transition-all duration-200
                ${isActive ? 'font-bold' : 'font-medium'}
                hover:text-[#22c6dc]
                after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2
                after:h-[3px] after:w-full after:rounded-full after:bg-[#22c6dc]
                after:origin-center after:scale-x-0 
                ${isActive ? 'after:scale-x-100' : 'group-hover:after:scale-x-100'}
                after:transition-transform after:duration-500
                after:ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right: auth/actions */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-1.5 text-sm md:px-6 md:py-2 rounded-full border-2 border-[#085480] text-[#085480] font-semibold transition-all duration-200 bg-white/80 md:bg-transparent shadow-sm md:shadow-none hover:bg-[#085480] hover:text-white"
        >
          Login
        </button>
      </div>
    </div>
  </div>
</nav>
  );
}
