import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import whatsappIcon from '../assets/WhatsApp.svg';
import automationIcon from '../assets/Automation.svg';
import productivityIcon from '../assets/Productivity.svg';

export default function Hero() {
  const navigate = useNavigate();
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  const cards = [
    {
      number: '1.',
      title: 'Work entirely inside WhatsApp',
      icon: null,
      color: '#075480',
      backgroundImage: whatsappIcon,
    },
    {
      number: '2.',
      title: 'Automate 80% of daily coordination',
      icon: null,
      color: '#ffb700',
      backgroundImage: automationIcon,
    },
    {
      number: '3.',
      title: 'Boost both productivity & cash flow',
      icon: null,
      color: '#009480',
      backgroundImage: productivityIcon,
    },
  ];

  useEffect(() => {
    // Small delay to ensure DOM is ready, then animate cards with stagger
    const timer = setTimeout(() => {
      cards.forEach((_, index) => {
        setTimeout(() => {
          setVisibleCards((prev) => {
            if (!prev.includes(index)) {
              return [...prev, index];
            }
            return prev;
          });
        }, index * 200); // Stagger animation: 200ms delay per card
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative pt-28 pb-12 px-6 min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-[#075480] leading-tight mb-4">
            Convert messages to POs<br />
            <span className="text-[#009583]">and get paid faster!</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl mb-6">
            <span className="font-bold">Built for Bharat. Designed for WhatsApp-first businesses:</span> SiMBly turns WhatsApp messages into clean POs and automates payment follow-ups — without you typing a single word.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/demorequests')}
              className="px-8 py-4 bg-[#075480] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Book Demo
            </button>
            <button
              onClick={() => navigate('/joinwaitlist')}
              className="px-8 py-4 border-2 border-[#075480] text-[#075480] font-semibold rounded-full hover:bg-[#075480]/10 transition-all duration-200"
            >
              Join Waitlist
            </button>
          </div>
        </div>

        {/* Cards Container - Animate on Mount */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {cards.map((card, index) => {
            const isVisible = visibleCards.includes(index);
            const hasBackground = card.backgroundImage !== null;
            
            return (
              <div
                key={index}
                className={`flex-shrink-0 w-72 h-80 rounded-2xl p-6 border-2 relative ${
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95'
                } transition-all duration-700 ease-out ${
                  hasBackground 
                    ? 'shadow-2xl flex flex-col overflow-hidden' 
                    : 'bg-white shadow-xl'
                }`}
                style={{ 
                  borderColor: card.color,
                  ...(hasBackground && {
                    backgroundImage: `url(${card.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  })
                }}
              >
                {/* 50% Opacity Overlay */}
                {hasBackground && (
                  <div 
                    className="absolute inset-0 bg-black opacity-50 z-0"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  />
                )}
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Large Number */}
                  <div
                    className="text-5xl font-bold mb-3"
                    style={{ color: card.color }}
                  >
                    {card.number}
                  </div>

                  {/* Title - positioned at bottom for background image cards */}
                  <h3
                    className={`text-lg font-bold text-center ${
                      hasBackground 
                        ? 'text-white mt-auto pt-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' 
                        : 'mt-4'
                    }`}
                    style={!hasBackground ? { color: card.color } : {}}
                  >
                    {card.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
