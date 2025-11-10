import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DemoRequestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    work_email: '',
    company_name: '',
    job_title: '',
    use_case: '',
    preferred_time: ''
  });

  const [errors, setErrors] = useState({
    full_name: '',
    work_email: '',
    company_name: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form
  const validateForm = () => {
    const newErrors = {
      full_name: '',
      work_email: '',
      company_name: ''
    };

    let isValid = true;

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
      isValid = false;
    }

    if (!formData.work_email.trim()) {
      newErrors.work_email = 'Work email is required';
      isValid = false;
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes (for both input and textarea)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the data object - match exact Supabase column names
      const submitData: any = {
        full_name: formData.full_name.trim(),
        work_email: formData.work_email.trim(),
        company_name: formData.company_name.trim(),
        created_at: new Date().toISOString(),
      };

      // Add optional fields only if they have values
      if (formData.job_title.trim()) {
        submitData.job_title = formData.job_title.trim();
      }
      if (formData.use_case.trim()) {
        submitData.use_case = formData.use_case.trim();
      }
      if (formData.preferred_time.trim()) {
        // Convert to ISO string for timestamp
        const dateTime = new Date(formData.preferred_time);
        if (!isNaN(dateTime.getTime())) {
          submitData.preferred_time = dateTime.toISOString();
        } else {
          submitData.preferred_time = formData.preferred_time.trim();
        }
      }

      // Log what we're sending for debugging (remove in production if needed)
      console.log('Submitting demo request with data:', submitData);

      const { error } = await supabase
        .from('demo_requests')
        .insert([submitData]);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Redirect to thank you page
      navigate('/thank-you', { 
        state: { 
          name: formData.full_name,
          email: formData.work_email 
        } 
      });
    } catch (error: any) {
      console.error('Error submitting demo request:', error);
      setSubmitError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background video (same as landing page) */}
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

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
          {/* Back button */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#075480] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#075480] mb-2">
              Book a Demo
            </h1>
            <p className="text-gray-600">
              Fill in your details and we'll get back to you soon!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Work Email */}
            <div>
              <label htmlFor="work_email" className="block text-sm font-medium text-gray-700 mb-2">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="work_email"
                name="work_email"
                value={formData.work_email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition ${
                  errors.work_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@company.com"
              />
              {errors.work_email && (
                <p className="mt-1 text-sm text-red-500">{errors.work_email}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition ${
                  errors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your company name"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>
              )}
            </div>

            {/* Job Title - Optional */}
            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition"
                placeholder="e.g., CEO, Manager, Owner"
              />
            </div>

            {/* Use Case - Optional */}
            <div>
              <label htmlFor="use_case" className="block text-sm font-medium text-gray-700 mb-2">
                Use Case
              </label>
              <textarea
                id="use_case"
                name="use_case"
                value={formData.use_case}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition resize-none"
                placeholder="Describe your use case or how you plan to use SiMBly..."
              />
            </div>

            {/* Preferred Time - Optional */}
            <div>
              <label htmlFor="preferred_time" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Demo Time
              </label>
              <input
                type="datetime-local"
                id="preferred_time"
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition"
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-[#075480] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

