import { LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SupplierList from './SupplierList';
import logo from '../assets/Simbly-logo copy.jpg';

export default function SupplierListPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 to-bg/20">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Simbly.ai" className="h-12 w-auto" />
              <h1 className="text-xl font-semibold text-gray-900">Supplier List</h1>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated && user && (
                <div className="text-sm text-gray-600">
                  Welcome, {user.email}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SupplierList />
      </div>
    </div>
  );
}
