import { Zap, TrendingUp } from 'lucide-react';

export default function Benefits() {
  const cards = [
    {
      title: 'Workflow Automation for Every WhatsApp Order',
      bullets: [
        'Save 10–12 hours every week',
        'Increase accuracy by 90%+',
        'Zero manual typing',
        'Scale to 3× more orders without hiring',
      ],
      icon: Zap,
    },
    {
      title: 'Automated Payment Follow-ups That Accelerate Cash Flow',
      bullets: [
        'Voice AI calls customers so you don\'t have to',
        'Collections speed up dramatically (45 days → 20–25 days)',
        'Reduce awkward conversations',
        'Real-time payment tracking',
      ],
      icon: TrendingUp,
    },
  ];

  return (
    <section id="benefits" className="p-8 md:p-10">
      <header className="mb-8 !text-left">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0c537e] leading-tight mb-4 font-sans">
          Benefits
        </h2>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-sans">
          The two biggest productivity boosts your business has ever seen!
        </p>
      </header>

      {/* Two Big Cards */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-[#085480]/10 grid place-items-center border border-[#085480]/20 flex-shrink-0">
                  <Icon className="h-6 w-6 text-[#085480]" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-sans">
                  {card.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {card.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-3">
                    <span className="text-[#085480] font-bold mt-1 font-sans">•</span>
                    <span className="text-base md:text-lg text-gray-700 font-sans">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Tagline */}
      <div className="text-center">
        <p className="text-xl md:text-2xl font-semibold text-[#085480] font-sans">
          Reduce order time. Eliminate payment delays. Grow without increasing staff.
        </p>
      </div>
    </section>
  );
}