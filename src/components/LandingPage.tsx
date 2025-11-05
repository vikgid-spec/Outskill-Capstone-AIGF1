import { useEffect } from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import Benefits from './Benefits';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';

export default function LandingPage() {
  // Set page title
  useEffect(() => {
    document.title = 'SiMBly - Convert Messages to POs';
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] overflow-x-hidden relative">
      {/* Fixed animated background video */}
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

      {/* Content layer (above the background) */}
      <div className="relative z-10">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 pt-4 pb-16 space-y-8">
          {/* Each section sits in a card-like block for visual rhythm */}
          <Hero />

          <section className="bg-white/50 border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
            <HowItWorks />
          </section>

          <section className="bg-white/50 border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
            <Benefits />
          </section>

          <section className="bg-white/50 border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
            <Pricing />
          </section>

            <Testimonials />

            <FAQ />
        </main>
        <Footer />
      </div>
    </div>
  );
}
