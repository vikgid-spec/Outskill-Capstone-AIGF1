import { Check, ArrowRight } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '₹2,999',
      period: 'per month',
      desc: 'For getting started',
      features: ['PO conversion', 'Gmail drafts', 'Up to 100 orders/mo', 'Basic reminders', 'Email support'],
      popular: false,
      cta: 'Start trial',
      tone: 'border-gray-200',
      btn: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    },
    {
      name: 'Growth',
      price: '₹6,999',
      period: 'per month',
      desc: 'Scale with confidence',
      features: ['Everything in Starter', 'Unlimited orders', 'Debit notes', 'Voice AI reminders', 'Tally export', 'Up to 5 users'],
      popular: true,
      cta: 'Book a demo',
      tone: 'ring-4 ring-sky-100 border-sky-200',
      btn: 'bg-sky-600 text-white hover:bg-sky-700',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      desc: 'Advanced needs',
      features: ['Unlimited users', 'Multi-branch', 'White-label', 'Custom workflows', 'Dedicated manager', 'API access'],
      popular: false,
      cta: 'Contact sales',
      tone: 'border-gray-200',
      btn: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    },
  ];

  return (
    <section id="pricing" className="p-8 md:p-10">
                  <header className="mb-6 text-left">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0c537e] leading-tight mb-4">
          Pricing
        </h2>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
          Simple tiers with clear value.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border border-gray-200/50 bg-white/50 shadow-sm overflow-hidden ${p.tone}`}
          >
            {p.popular && (
              <div className="bg-sky-50/50 text-sky-700 text-center text-xs font-medium py-2 border-b border-sky-100/50">
                MOST POPULAR
              </div>
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{p.desc}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                <span className="text-sm text-gray-600 ml-2">/ {p.period}</span>
              </div>

              {p.cta !== 'Book a demo' && (
                <button
                  className={`w-full mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${p.btn}`}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <ul className="mt-6 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-sky-600 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}