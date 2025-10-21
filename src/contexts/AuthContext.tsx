import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  sessionTimeout: number;
  timeRemaining: number;
  resetSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout] = useState(2 * 60 * 1000); // 2 minutes in milliseconds
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeout);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [warningShown, setWarningShown] = useState(false);
  const [warningTimeoutId, setWarningTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Reset session timer
  const resetSession = () => {
    console.log('🔄 Resetting session timer');
    setTimeRemaining(sessionTimeout);
    setWarningShown(false);
    
    // Clear existing timeouts
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (warningTimeoutId) {
      clearTimeout(warningTimeoutId);
      setWarningTimeoutId(null);
    }
    
    console.log('⏰ Session timer reset - user has', sessionTimeout, 'ms before timeout');
  };

  // Handle session timeout - show warning and set up auto-logout
  const handleSessionTimeout = () => {
    console.log('🕐 Session timeout warning - showing user warning');
    setWarningShown(true);
    
    // Set up auto-logout after 30 seconds of warning
    const warningTimeout = setTimeout(() => {
      console.log('🕐 Auto-logout after warning period');
      logout();
    }, 30000); // 30 seconds after warning
    
    setWarningTimeoutId(warningTimeout);
  };

  // Session timeout disabled - only manual logout
  // useEffect(() => {
  //   if (timeRemaining <= 30000 && timeRemaining > 0 && !warningShown && isAuthenticated) {
  //     setWarningShown(true);
  //     console.log('⚠️ Session timeout warning triggered');
  //   }
  // }, [timeRemaining, warningShown, isAuthenticated]);

  // Countdown timer disabled - no automatic logout
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   console.log('⏰ Starting countdown timer for authenticated user');

  //   const interval = setInterval(() => {
  //     setTimeRemaining(prev => {
  //       console.log('⏰ Time remaining:', prev);
  //       if (prev <= 1000) {
  //         console.log('⏰ Time expired, showing warning');
  //         // Show warning instead of auto-logout
  //         handleSessionTimeout();
  //         return 0;
  //       }
  //       return prev - 1000;
  //     });
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [isAuthenticated]);

  // Activity detection disabled - no automatic logout
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
  //   const handleActivity = () => {
  //     console.log('🔄 User activity detected - resetting session timer');
  //     resetSession();
  //   };

  //   events.forEach(event => {
  //     document.addEventListener(event, handleActivity, true);
  //   });

  //   return () => {
  //     events.forEach(event => {
  //       document.removeEventListener(event, handleActivity, true);
  //     });
  //   };
  // }, [isAuthenticated]);

  // Initialize auth state
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            resetSession();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('✅ User authenticated');
          // Session timeout disabled - no automatic logout
        } else {
          console.log('❌ User not authenticated');
          // Session timeout disabled - no automatic logout
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('❌ Login error:', error.message);
        return { error };
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        // Don't call resetSession here - let the auth state change handler do it
      }

      return { error: null };
    } catch (error) {
      console.log('❌ Login exception:', error);
      return { error };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setTimeRemaining(sessionTimeout);
      setWarningShown(false);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
        setWarningTimeoutId(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    isAuthenticated,
    sessionTimeout,
    timeRemaining,
    resetSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
