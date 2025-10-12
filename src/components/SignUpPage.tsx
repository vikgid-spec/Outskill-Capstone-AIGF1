import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
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
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        return { isValid: true, message: 'Username available' };
      } else if (data) {
        // Username exists
        return { isValid: false, message: 'Username already taken' };
      } else {
        // Other error
        return { isValid: false, message: 'Error checking username availability' };
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
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        // Fallback: check in our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();

        if (userError && userError.code === 'PGRST116') {
          return { isValid: true, message: '' };
        } else if (userData) {
          return { isValid: false, message: 'Email already registered' };
        }
      }

      const existingUser = data?.users.find(user => user.email === email);
      if (existingUser) {
        return { isValid: false, message: 'Email already registered' };
      }

      return { isValid: true, message: '' };
    } catch (error) {
      return { isValid: true, message: '' }; // Allow registration attempt
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
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            username: formData.username
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Insert user data into our users table
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: formData.name,
              username: formData.username,
              email: formData.email
            }
          ]);

        if (insertError) {
          throw insertError;
        }
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

  // Get strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return '#F2AEBB';
      case 'medium': return '#A7AAE1';
      case 'strong': return '#696FC7';
      default: return '#F2AEBB';
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (usernameTimer) clearTimeout(usernameTimer);
    };
  }, [usernameTimer]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#F5D3C4' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: '#2D2D2D' }}>
              H.G. Hawa & Co
            </h1>
            <p className="text-gray-600 font-sans">
              Purchase Order Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2D2D2D' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  focusRingColor: '#696FC7',
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#2D2D2D' }}>
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  focusRingColor: '#696FC7',
                  borderColor: validation.username.message && !validation.username.isValid ? '#F2AEBB' : undefined
                }}
              />
              {formData.username && (
                <div className="flex items-center mt-2 text-sm">
                  {validation.username.isChecking ? (
                    <div className="flex items-center" style={{ color: '#696FC7' }}>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking availability...
                    </div>
                  ) : validation.username.message ? (
                    <div className="flex items-center" style={{ color: validation.username.isValid ? '#696FC7' : '#F2AEBB' }}>
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#2D2D2D' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  focusRingColor: '#696FC7',
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
                        className="underline hover:no-underline"
                        style={{ color: '#696FC7' }}
                        onClick={() => {/* Navigate to login */}}
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#2D2D2D' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    focusRingColor: '#696FC7',
                    borderColor: validation.password.message ? '#F2AEBB' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                  style={{ color: '#696FC7' }}
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
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: getStrengthColor(validation.password.strength),
                          width: validation.password.strength === 'weak' ? '33%' : 
                                 validation.password.strength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium capitalize" style={{ color: getStrengthColor(validation.password.strength) }}>
                      {validation.password.strength}
                    </span>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      {passwordRequirements.minLength ? (
                        <Check className="w-4 h-4 mr-2" style={{ color: '#696FC7' }} />
                      ) : (
                        <X className="w-4 h-4 mr-2" style={{ color: '#F2AEBB' }} />
                      )}
                      <span style={{ color: passwordRequirements.minLength ? '#696FC7' : '#F2AEBB' }}>
                        Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasNumber ? (
                        <Check className="w-4 h-4 mr-2" style={{ color: '#696FC7' }} />
                      ) : (
                        <X className="w-4 h-4 mr-2" style={{ color: '#F2AEBB' }} />
                      )}
                      <span style={{ color: passwordRequirements.hasNumber ? '#696FC7' : '#F2AEBB' }}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasUppercase ? (
                        <Check className="w-4 h-4 mr-2" style={{ color: '#696FC7' }} />
                      ) : (
                        <X className="w-4 h-4 mr-2" style={{ color: '#F2AEBB' }} />
                      )}
                      <span style={{ color: passwordRequirements.hasUppercase ? '#696FC7' : '#F2AEBB' }}>
                        At least one uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center">
                      {passwordRequirements.hasLowercase ? (
                        <Check className="w-4 h-4 mr-2" style={{ color: '#696FC7' }} />
                      ) : (
                        <X className="w-4 h-4 mr-2" style={{ color: '#F2AEBB' }} />
                      )}
                      <span style={{ color: passwordRequirements.hasLowercase ? '#696FC7' : '#F2AEBB' }}>
                        At least one lowercase letter
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Message */}
            {submitMessage && (
              <div className={`p-4 rounded-lg text-sm ${
                submitMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p style={{ color: submitMessage.type === 'success' ? '#696FC7' : '#F2AEBB' }}>
                  {submitMessage.text}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#F2AEBB' }}
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
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: '#696FC7' }}
                onClick={() => {/* Navigate to login */}}
              >
                Log in
              </button>
            </p>
            <p className="text-sm text-gray-600">
              Forgot your password?{' '}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: '#A7AAE1' }}
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