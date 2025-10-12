import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SupabaseTest from './components/SupabaseTest';
import MillsTest from './components/MillsTest';
import SignUpPage from './components/SignUpPage';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'test' | 'mills' | 'signup'>('signup');

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
        <SignUpPage />
      ) : (
        <Dashboard onNavigate={handleNavigation} />
      )}
    </>
  );
}

export default App;
