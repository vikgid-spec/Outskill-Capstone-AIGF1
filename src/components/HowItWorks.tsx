import { MessageSquare, FileCheck, Send, FileText, Mic, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    { 
      icon: MessageSquare, 
      title: 'Customer sends order on WhatsApp', 
      desc: 'No change in behaviour. Simple, familiar.',
      shortTitle: 'WhatsApp Order Received',
      bgColor: '#085480',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
    { 
      icon: FileCheck, 
      title: 'SiMBly converts the message into a clean Purchase Order', 
      desc: 'Extracted, structured, and auto-drafted in your Email Box.',
      shortTitle: 'AI Converts to PO',
      bgColor: '#085480',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
    { 
      icon: Send, 
      title: 'You review & send with one click', 
      desc: 'Orders go out faster and cleaner.',
      shortTitle: 'You Review',
      bgColor: '#ffb700',
      textColor: '#085480',
      iconColor: '#085480',
    },
    { 
      icon: FileText, 
      title: 'Invoices & debit notes auto-generated', 
      desc: 'No more manual document creation. Coming soon!',
      shortTitle: 'Debit Note Created',
      bgColor: '#ffb700',
      textColor: '#085480',
      iconColor: '#085480',
    },
    { 
      icon: Mic, 
      title: 'Voice AI follows up for payments', 
      desc: 'Polite, timely reminders in Hindi, English, or regional languages.',
      shortTitle: 'Payment follow up',
      bgColor: '#009480',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
    { 
      icon: LayoutDashboard, 
      title: 'Everything tracked on your dashboard', 
      desc: 'Orders, payments, reminders, status — all in one view.',
      shortTitle: 'Dashboard tracking',
      bgColor: '#009480',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
  ];

  return (
    <section id="how-it-works" className="p-8 md:p-10">
      <header className="mb-6 !text-left">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0c537e] leading-tight mb-4">
          How it works
        </h2>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
          A simple flow from message to fulfilled order.
        </p>
      </header>

      {/* Full-width Video */}
      <div className="relative w-full mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 bg-white/50">
        <video
          className="w-full h-auto block"
          src="/hero.mp4"
          controls
          playsInline
          autoPlay
          loop
          muted
        />
      </div>

      {/* Horizontal Accordion */}
      <div className="w-full h-[280px] md:h-[320px] flex gap-2 overflow-hidden">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeIndex === index;
          
          return (
            <div
              key={index}
              className={`relative flex-shrink-0 transition-all duration-500 ease-in-out cursor-pointer rounded-2xl overflow-hidden border-2 ${
                isActive 
                  ? 'flex-[3] border-[#085480]' 
                  : 'flex-[1] border-gray-200/50 hover:flex-[1.5]'
              }`}
              onClick={() => setActiveIndex(index)}
              style={{
                backgroundColor: `${step.bgColor}CC`, // 80% opacity (CC = 204/255 ≈ 0.8)
              }}
            >
              {/* Content Container */}
              <div className={`absolute inset-0 p-4 md:p-5 flex flex-col transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'opacity-100'
              }`}>
                {/* Icon */}
                <div className={`mb-3 transition-all duration-500 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}>
                  <div className="h-10 w-10 rounded-lg bg-white/20 grid place-items-center border border-white/30">
                    <Icon className={`h-5 w-5 transition-colors duration-500`} style={{ color: step.iconColor }} />
                  </div>
                </div>

                {/* Title - Shows short title when inactive, full title when active */}
                {isActive ? (
                  <>
                    <h3 className="font-medium mb-2 text-base md:text-lg transition-all duration-500" style={{ color: step.textColor }}>
                      {step.title}
                    </h3>
                    {/* Description - Only visible when active */}
                    <p className="leading-relaxed text-sm md:text-base transition-all duration-500 mb-2" style={{ color: step.textColor, opacity: 0.9 }}>
                      {step.desc}
                    </p>
                  </>
                ) : (
                  <h3 className="font-medium mb-2 text-lg md:text-xl transition-all duration-500" style={{ color: step.textColor }}>
                    {step.shortTitle}
                  </h3>
                )}

                {/* Number Badge */}
                <div className={`mt-auto text-xl md:text-2xl font-bold transition-all duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-80'
                }`} style={{ color: step.textColor }}>
                  {index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
