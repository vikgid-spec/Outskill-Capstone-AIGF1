import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Login | SiMBly';
  }, []);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [validation, setValidation] = useState({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Validate email format
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  };

  // Validate password
  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return { isValid: false, message: 'Password is required' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    return { isValid: true, message: '' };
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitMessage(null); // Clear any previous error messages

    // Validate based on field
    switch (field) {
      case 'email':
        setValidation(prev => ({
          ...prev,
          email: validateEmail(value)
        }));
        break;

      case 'password':
        setValidation(prev => ({
          ...prev,
          password: validatePassword(value)
        }));
        break;
    }
  };

  // Check if form is valid
  const isFormValid = validation.email.isValid && 
                     validation.password.isValid && 
                     formData.email.trim() !== '' && 
                     formData.password.trim() !== '';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Use the auth context login function
      const { error } = await login(formData.email, formData.password);

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          setSubmitMessage({
            type: 'error',
            text: 'Invalid email or password. Please check your credentials and try again.'
          });
        } else if (error.message.includes('Email not confirmed')) {
          setSubmitMessage({
            type: 'error',
            text: 'Please check your email and click the confirmation link before logging in.'
          });
        } else {
          setSubmitMessage({
            type: 'error',
            text: error.message || 'An error occurred during login'
          });
        }
        return;
      }

      // Login successful
      setSubmitMessage({
        type: 'success',
        text: 'Welcome back! Redirecting to dashboard...'
      });

      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setSubmitMessage({
        type: 'error',
        text: 'Please enter your email address first'
      });
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setSubmitMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setSubmitMessage({
          type: 'error',
          text: error.message
        });
      } else {
        setSubmitMessage({
          type: 'success',
          text: 'Password reset email sent! Please check your inbox.'
        });
      }
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: 'Failed to send reset email. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          className="w-full h-full object-cover opacity-90"
          src="/background-video-1.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center text-sm mb-6 transition-colors text-[#075480] hover:text-[#03c5dc]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home Page
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-sans font-bold mb-4 text-[#075480]">
              Welcome Back
            </h1>
            <p className="text-gray-600 font-sans mb-2">
              Purchase Order Management System
            </p>
            <p className="text-sm text-gray-500 font-sans">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2 font-sans text-[#075480]">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] transition-colors font-sans"
                style={{ 
                  borderColor: validation.email.message ? '#F2AEBB' : undefined
                }}
                autoComplete="email"
              />
              {validation.email.message && (
                <p className="text-sm mt-1" style={{ color: '#F2AEBB' }}>
                  {validation.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2 font-sans text-[#075480]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] transition-colors font-sans"
                  style={{ 
                    borderColor: validation.password.message ? '#F2AEBB' : undefined
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-[#03c5dc] hover:text-[#075480] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validation.password.message && (
                <p className="text-sm mt-1" style={{ color: '#F2AEBB' }}>
                  {validation.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-[#03c5dc] transition-colors"
                  style={{ accentColor: '#075480' }}
                />
                <span className="ml-2 text-sm text-gray-600 font-sans">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium hover:underline transition-colors font-sans text-[#03c5dc] hover:text-[#075480]"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Message */}
            {submitMessage && (
              <div className={`p-4 rounded-lg text-sm font-sans ${
                submitMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={submitMessage.type === 'success' ? 'text-[#075480]' : 'text-red-600'}>
                  {submitMessage.text}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full px-8 py-4 bg-[#075480] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-sans"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600 font-sans">
              Don't have an account?{' '}
              <button
                type="button"
                className="font-semibold hover:underline transition-colors text-[#075480] hover:text-[#03c5dc] font-sans"
                onClick={() => navigate('/signup')}
              >
                Sign up
              </button>
            </p>
            
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 font-sans">
              <button
                type="button"
                className="hover:underline transition-colors"
                onClick={() => {/* Navigate to privacy policy */}}
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                className="hover:underline transition-colors"
                onClick={() => {/* Navigate to terms */}}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}