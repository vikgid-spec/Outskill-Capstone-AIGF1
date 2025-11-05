import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ValidationState {
  name: { isValid: boolean; message: string };
  username: { isValid: boolean; message: string; isChecking: boolean };
  email: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string; strength: 'weak' | 'medium' | 'strong' };
}

interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const [validation, setValidation] = useState<ValidationState>({
    name: { isValid: false, message: '' },
    username: { isValid: false, message: '', isChecking: false },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '', strength: 'weak' }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce timer for username checking
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(null);

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasLowercase: false
  });

  // Validate name
  const validateName = (name: string) => {
    if (name.length < 10) {
      return { isValid: false, message: 'Full name must be at least 10 characters' };
    }
    return { isValid: true, message: '' };
  };

  // Validate username format
  const validateUsernameFormat = (username: string) => {
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { isValid: false, message: 'Username must be no more than 20 characters' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters and numbers' };
    }
    return { isValid: true, message: '' };
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .limit(1);

      if (error) {
        return { isValid: false, message: 'Error checking username availability' };
      }
      
      if (data.length === 0) {
        // No rows returned, username is available
        return { isValid: true, message: 'Username available' };
      } else {
        // Username exists
        return { isValid: false, message: 'Username already taken' };
      }
    } catch (error) {
      return { isValid: false, message: 'Error checking username availability' };
    }
  };

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  };

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    try {
      // Check in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (userError) {
        return { isValid: false, message: 'Error checking email availability' };
      }
      
      if (userData.length === 0) {
        // No rows returned, email is available
        return { isValid: true, message: '' };
      } else {
        // Email exists
        return { isValid: false, message: 'Email already registered' };
      }
    } catch (error) {
      return { isValid: false, message: 'Error checking email availability' };
    }
  };

  // Validate password and calculate strength
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password)
    };

    setPasswordRequirements(requirements);

    const validCount = Object.values(requirements).filter(Boolean).length;
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (password.length >= 10 && validCount === 4 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 6 && validCount >= 2) {
      strength = 'medium';
    }

    const isValid = Object.values(requirements).every(Boolean);
    const message = isValid ? '' : 'Password must meet all requirements';

    return { isValid, message, strength };
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate based on field
    switch (field) {
      case 'name':
        setValidation(prev => ({
          ...prev,
          name: validateName(value)
        }));
        break;

      case 'username':
        const formatValidation = validateUsernameFormat(value);
        setValidation(prev => ({
          ...prev,
          username: { ...formatValidation, isChecking: false }
        }));

        // Debounced availability check
        if (formatValidation.isValid && value.length >= 3) {
          if (usernameTimer) clearTimeout(usernameTimer);
          
          setValidation(prev => ({
            ...prev,
            username: { ...prev.username, isChecking: true }
          }));

          const timer = setTimeout(async () => {
            const availabilityCheck = await checkUsernameAvailability(value);
            setValidation(prev => ({
              ...prev,
              username: { ...availabilityCheck, isChecking: false }
            }));
          }, 500);

          setUsernameTimer(timer);
        }
        break;

      case 'email':
        const emailValidation = validateEmail(value);
        setValidation(prev => ({
          ...prev,
          email: emailValidation
        }));

        // Check email availability if format is valid
        if (emailValidation.isValid) {
          checkEmailAvailability(value).then(result => {
            setValidation(prev => ({
              ...prev,
              email: result
            }));
          });
        }
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
  const isFormValid = Object.values(validation).every(field => field.isValid) && 
                     Object.values(formData).every(value => value.trim() !== '');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Insert user data into our users table
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: formData.name,
            username: formData.username,
            email: formData.email
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Create user in Supabase Auth with the same ID
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        // If auth fails, we should clean up the user record
        await supabase
          .from('users')
          .delete()
          .eq('email', formData.email);
        
        throw authError;
      }

      setSubmitMessage({
        type: 'success',
        text: 'Account created successfully! Please check your email to verify your account.'
      });

      // Reset form
      setFormData({ name: '', username: '', email: '', password: '' });
      
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.message || 'An error occurred during registration'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get strength color (for background)
  const getStrengthBgColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-600';
      case 'medium': return 'bg-[#03c5dc]';
      case 'strong': return 'bg-[#075480]';
      default: return 'bg-red-600';
    }
  };
  
  // Get strength text color
  const getStrengthTextColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-[#03c5dc]';
      case 'strong': return 'text-[#075480]';
      default: return 'text-red-600';
    }
  };

  // Set page title
  useEffect(() => {
    document.title = 'Sign Up | SiMBly';
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (usernameTimer) clearTimeout(usernameTimer);
    };
  }, [usernameTimer]);

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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-sans font-bold mb-4 text-[#075480]">
              Create Account
            </h1>
            <p className="text-gray-600 font-sans mb-2">
              Purchase Order Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-2 font-sans text-[#075480]">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] transition-colors font-sans"
                style={{ 
                  borderColor: validation.name.message ? '#F2AEBB' : undefined
                }}
              />
              {validation.name.message && (
                <p className="text-sm mt-1" style={{ color: '#F2AEBB' }}>
                  {validation.name.message}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium mb-2 font-sans text-[#075480]">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] transition-colors font-sans"
                style={{ 
                  borderColor: validation.username.message && !validation.username.isValid ? '#F2AEBB' : undefined
                }}
              />
              {formData.username && (
                <div className="flex items-center mt-2 text-sm">
                  {validation.username.isChecking ? (
                    <div className="flex items-center text-[#03c5dc] font-sans">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking availability...
                    </div>
                  ) : validation.username.message ? (
                    <div className={`flex items-center font-sans ${validation.username.isValid ? 'text-[#075480]' : 'text-red-600'}`}>
                      {validation.username.isValid ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      {validation.username.message}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
                  borderColor: validation.email.message && !validation.email.isValid ? '#F2AEBB' : undefined
                }}
              />
              {validation.email.message && !validation.email.isValid && (
                <p className="text-sm mt-1" style={{ color: '#F2AEBB' }}>
                  {validation.email.message}
                  {validation.email.message === 'Email already registered' && (
                    <span>
                      {' '}
                      <button
                        type="button"
                        className="underline hover:no-underline text-[#075480] hover:text-[#03c5dc] transition-colors font-sans"
                        onClick={() => navigate('/login')}
                      >
                        Log in instead
                      </button>
                    </span>
                  )}
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
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] transition-colors font-sans"
                  style={{ 
                    borderColor: validation.password.message ? '#F2AEBB' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-[#03c5dc] hover:text-[#075480] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          validation.password.strength === 'weak' ? 'bg-red-600' :
                          validation.password.strength === 'medium' ? 'bg-[#03c5dc]' :
                          'bg-[#075480]'
                        }`}
                        style={{
                          width: validation.password.strength === 'weak' ? '33%' : 
                                 validation.password.strength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                    <span className={`ml-3 text-sm font-medium capitalize font-sans ${
                      validation.password.strength === 'weak' ? 'text-red-600' :
                      validation.password.strength === 'medium' ? 'text-[#03c5dc]' :
                      'text-[#075480]'
                    }`}>
                      {validation.password.strength}
                    </span>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="space-y-1 text-sm font-sans">
                    <div className="flex items-center">
                      {passwordRequirements.minLength ? (
                        <Check className="w-4 h-4 mr-2 text-[#075480]" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600" />
                      )}
                      <span className={passwordRequirements.minLength ? 'text-[#075480]' : 'text-red-600'}>
                        Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasNumber ? (
                        <Check className="w-4 h-4 mr-2 text-[#075480]" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600" />
                      )}
                      <span className={passwordRequirements.hasNumber ? 'text-[#075480]' : 'text-red-600'}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasUppercase ? (
                        <Check className="w-4 h-4 mr-2 text-[#075480]" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600" />
                      )}
                      <span className={passwordRequirements.hasUppercase ? 'text-[#075480]' : 'text-red-600'}>
                        At least one uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasLowercase ? (
                        <Check className="w-4 h-4 mr-2 text-[#075480]" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600" />
                      )}
                      <span className={passwordRequirements.hasLowercase ? 'text-[#075480]' : 'text-red-600'}>
                        At least one lowercase letter
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600 font-sans">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold hover:underline transition-colors text-[#075480] hover:text-[#03c5dc] font-sans"
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
            </p>
            <p className="text-sm text-gray-600 font-sans">
              Forgot your password?{' '}
              <button
                type="button"
                className="font-semibold hover:underline transition-colors text-[#03c5dc] hover:text-[#075480] font-sans"
                onClick={() => {/* Navigate to reset password */}}
              >
                Reset it
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}