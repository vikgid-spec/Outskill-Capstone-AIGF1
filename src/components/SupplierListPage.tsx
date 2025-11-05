import { LogOut, Package, Users, Building2, CreditCard, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import SupplierList from './SupplierList';
import logo from '../assets/Logo without tagline-darkBG.svg';

export default function SupplierListPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Suppliers | SiMBly';
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  const sidebarLinks = [
    { title: 'Dashboard', desc: 'Overview and metrics', icon: LayoutDashboard, href: '/dashboard', iconColor: 'text-blue-400' },
    { title: 'PO List', desc: 'Manage purchase orders', icon: Package, href: '/polist', iconColor: 'text-sky-400' },
    { title: 'Consignees', desc: 'Manage customers', icon: Users, href: '/consigneelist', iconColor: 'text-emerald-400' },
    { title: 'Suppliers', desc: 'Manage suppliers', icon: Building2, href: '/supplierlist', iconColor: 'text-violet-400' },
    { title: 'Debtors', desc: 'Track receivables', icon: CreditCard, href: '/debtorlist', iconColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Dark Sidebar (226px) */}
      <aside className="w-[226px] bg-[#2D3748] flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = link.href === location.pathname;
            return (
              <button
                key={index}
                type="button"
                onClick={() => navigate(link.href)}
                className={`group w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? 'bg-[#03c5dc] text-white'
                    : 'text-[#03c5dc] hover:bg-[#03c5dc] hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#03c5dc] group-hover:text-white'
                }`} />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#03c5dc] group-hover:text-white'}`}>{link.title}</div>
                  <div className={`text-xs ${isActive ? 'text-white' : 'text-[#03c5dc] group-hover:text-white'}`}>{link.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[226px] bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <SupplierList />
        </div>
      </main>
    </div>
  );
}
