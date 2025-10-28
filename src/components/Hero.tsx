import { Play, ArrowRight } from 'lucide-react';
import orderReceived from '../assets/Order received-1 copy.jpeg';
import poCreated from '../assets/PO created - 1 copy.jpeg';
import { supabase } from '../lib/supabase'


export default function Hero() {
  return (
    <section id="hero" className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight mb-6">
              Turn WhatsApp messages into orders, automatically!
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Save 10+ hours weekly and cut errors by 70%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-[0_8px_24px_rgba(30,90,125,0.35)] hover:shadow-[0_12px_32px_rgba(30,90,125,0.45)] transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 hover:bg-[#174864]">
                Book a Demo
                <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-primary flex items-center justify-center gap-2">
                <Play size={20} />
                Watch How it Works
              </button>
            </div>
            <div className="mt-8 flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-gray-600">Hours saved weekly</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <div className="text-3xl font-bold text-primary">70%</div>
                <div className="text-sm text-gray-600">Error reduction</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <div className="text-3xl font-bold text-primary">3x</div>
                <div className="text-sm text-gray-600">More orders</div>
              </div>
            </div>
          </div>

          <div className="relative space-y-8">
            {/* Before - Order Received */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <img
                  src={orderReceived}
                  alt="Business owner receiving order details on WhatsApp - looking stressed"
                  className="w-full h-80 object-cover"
                />
                <div className="p-6">
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                <ArrowRight size={24} className="text-white" />
              </div>
            </div>

            {/* After - PO Created */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <img
                  src={poCreated}
                  alt="Business owner happy after PO is automatically created"
                  className="w-full h-80 object-cover"
                />
                <div className="p-6">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}