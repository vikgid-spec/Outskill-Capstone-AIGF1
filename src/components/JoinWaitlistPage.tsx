import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function JoinWaitlistPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    notify: false,
  });

  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    notify: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors = {
      full_name: '',
      email: '',
      notify: '',
    } as const;

    let isValid = true;

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    }

    if (!formData.notify) {
      newErrors.notify = 'Please confirm you want to be notified';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: Record<string, unknown> = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        notify: formData.notify,
        joined_at: new Date().toISOString(),
      };

      if (formData.company_name.trim()) {
        submitData.company_name = formData.company_name.trim();
      }

      const { error } = await supabase
        .from('join_waitlist')
        .insert([submitData]);

      if (error) {
        throw error;
      }

      try {
        const emailResponse = await fetch('/api/sendWaitlistEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
          }),
        });

        if (!emailResponse.ok) {
          const message = await emailResponse.text();
          console.error('Failed to send waitlist email:', message);
        }
      } catch (emailError) {
        console.error('Error calling waitlist email endpoint:', emailError);
      }

      navigate('/thank-you', {
        state: {
          name: formData.full_name,
          email: formData.email,
        },
      });
    } catch (error: any) {
      console.error('Error submitting waitlist request:', error);
      setSubmitError(error.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#075480] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#075480] mb-2">
              Join the Waitlist
            </h1>
            <p className="text-gray-600">
              Leave your details so we can notify you the moment we launch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075480] focus:border-transparent transition"
                placeholder="Enter your company name"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="notify"
                name="notify"
                checked={formData.notify}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#075480] focus:ring-[#075480]"
              />
              <label htmlFor="notify" className="text-sm text-gray-700">
                Notify me when you launch <span className="text-red-500">*</span>
              </label>
            </div>
            {errors.notify && (
              <p className="text-sm text-red-500">{errors.notify}</p>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-[#075480] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

