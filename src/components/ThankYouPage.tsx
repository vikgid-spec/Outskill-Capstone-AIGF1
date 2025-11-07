import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || 'there';

  useEffect(() => {
    document.title = 'Thank You | SiMBly';
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background video */}
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-[#075480] mb-4">
            Thank You, {name}!
          </h1>
          <p className="text-gray-600 mb-2">
            Your demo request has been submitted successfully.
          </p>
          <p className="text-gray-600 mb-8">
            Our team will reach out to you soon at your work email.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/home')}
              className="w-full bg-[#075480] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0a4a6e] transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/demorequests')}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-[#075480] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Submit Another Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

