import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SupabaseTest from './components/SupabaseTest';
import MillsTest from './components/MillsTest';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'test' | 'mills' | 'signup' | 'login'>('login');

  const handleNavigation = (section: string) => {
    if (section === 'dashboard') {
      setCurrentView('dashboard');
    } else if (section === 'test') {
      setCurrentView('test');
    } else if (section === 'mills') {
      setCurrentView('mills');
    } else if (section === 'landing') {
      setCurrentView('landing');
    } else if (section === 'signup') {
      setCurrentView('signup');
    } else if (section === 'login') {
      setCurrentView('login');
    }
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage onNavigate={handleNavigation} />
      ) : currentView === 'test' ? (
        <SupabaseTest />
      ) : currentView === 'mills' ? (
        <MillsTest />
      ) : currentView === 'signup' ? (
        <SignUpPage onNavigate={handleNavigation} />
      ) : currentView === 'login' ? (
        <LoginPage onNavigate={handleNavigation} />
      ) : (
        <Dashboard onNavigate={handleNavigation} />
      )}
    </>
  );
}

export default App;
