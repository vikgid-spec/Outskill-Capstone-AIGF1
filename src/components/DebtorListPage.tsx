import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, LogOut } from 'lucide-react';
import DebtorList from './DebtorList';

const DebtorListPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Debtor List</h1>
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
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <DebtorList />
      </main>
    </div>
  );
};

export default DebtorListPage;
