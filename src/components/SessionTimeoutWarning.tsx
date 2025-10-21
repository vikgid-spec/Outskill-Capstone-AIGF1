import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SessionTimeoutWarning() {
  const { timeRemaining, resetSession, isAuthenticated, logout } = useAuth();
  const [warningTimeRemaining, setWarningTimeRemaining] = useState(30); // 30 seconds warning period

  // Show warning when time is running low (30 seconds or less, or when timeRemaining is 0)
  if (!isAuthenticated || timeRemaining > 30000) {
    return null;
  }

  // Countdown for warning period
  useEffect(() => {
    if (!isAuthenticated || timeRemaining > 30000) return;

    const interval = setInterval(() => {
      setWarningTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-logout will be handled by AuthContext
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, timeRemaining]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const handleExtendSession = () => {
    console.log('🔄 User extending session');
    resetSession();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">
              Session Timeout Warning
            </h3>
            <p className="text-sm text-red-700 mt-2">
              {timeRemaining > 0 ? (
                <>
                  Your session will expire in{' '}
                  <span className="font-semibold text-red-900">
                    {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                  </span>{' '}
                  due to inactivity.
                </>
              ) : (
                <>
                  Your session has expired due to inactivity. You will be automatically logged out in{' '}
                  <span className="font-semibold text-red-900">
                    {warningTimeRemaining}s
                  </span>{' '}
                  if you don't extend your session.
                </>
              )}
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleExtendSession}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend Session
              </button>
              <button
                onClick={logout}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Click "Extend Session" to continue working, or you can also click anywhere on the page to reset the timer. 
              If you don't respond, you'll be automatically logged out and redirected to the landing page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
