import { Package, Users, Building2, LogOut, ArrowRight, CreditCard, LayoutDashboard, MessageSquare, Mail, Phone, Activity } from 'lucide-react';
import logo from '../assets/Logo without tagline-darkBG.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  // Set page title
  useEffect(() => {
    document.title = 'Dashboard | SiMBly';
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState({
    ordersTotal: 0,
    ordersPending: 0,
    callsCompleted: 0,
    callsPending: 0,
  });

  // Fetch user name from Supabase users table
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('email', user.email)
            .single();

          if (error) {
            console.error('Error fetching user name:', error);
          } else if (data) {
            setUserName(data.name);
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
        }
      }
    };

    fetchUserName();
  }, [user?.email]);

  // Animate numbers on first page load
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedValues({
        ordersTotal: Math.floor(247 * easeOutQuart),
        ordersPending: Math.floor(18 * easeOutQuart),
        callsCompleted: Math.floor(45 * easeOutQuart),
        callsPending: Math.floor(8 * easeOutQuart),
      });

      if (step >= steps) {
        clearInterval(timer);
        // Set final values
        setAnimatedValues({
          ordersTotal: 247,
          ordersPending: 18,
          callsCompleted: 45,
          callsPending: 8,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  const stats = [
    { 
      label: 'Orders', 
      total: '247', 
      pending: '18',
      change: '+12%', 
      icon: Package, 
      tone: 'from-sky-500 to-sky-600' 
    },
    { 
      label: 'Calls', 
      completed: '45',
      pending: '8',
      change: '+8%', 
      icon: Phone, 
      tone: 'from-emerald-500 to-emerald-600' 
    },
  ];

  // Mock activity data - in production, this would come from Supabase
  const activities = [
    { 
      id: 1, 
      type: 'whatsapp', 
      title: 'WhatsApp message converted to PO', 
      description: 'PO-073 created from WhatsApp conversation', 
      time: '2 minutes ago',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50'
    },
    { 
      id: 2, 
      type: 'email', 
      title: 'Email saved to drafts', 
      description: 'Payment reminder draft created for Acme Corp', 
      time: '15 minutes ago',
      icon: Mail,
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      id: 3, 
      type: 'call', 
      title: 'Call made on debtor list', 
      description: 'Follow-up call completed with Delta Traders', 
      time: '1 hour ago',
      icon: Phone,
      color: 'text-purple-600 bg-purple-50'
    },
    { 
      id: 4, 
      type: 'whatsapp', 
      title: 'WhatsApp message converted to PO', 
      description: 'PO-072 created from WhatsApp conversation', 
      time: '2 hours ago',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50'
    },
    { 
      id: 5, 
      type: 'email', 
      title: 'Email saved to drafts', 
      description: 'Invoice reminder draft created for Northbay', 
      time: '3 hours ago',
      icon: Mail,
      color: 'text-blue-600 bg-blue-50'
    },
  ];

  const sidebarLinks = [
    { title: 'Dashboard', desc: 'Overview and metrics', icon: LayoutDashboard, href: '/dashboard', iconColor: 'text-blue-400' },
    { title: 'PO List', desc: 'Manage purchase orders', icon: Package, href: '/polist', iconColor: 'text-sky-400' },
    { title: 'Consignees', desc: 'Manage customers', icon: Users, href: '/consigneelist', iconColor: 'text-emerald-400' },
    { title: 'Suppliers', desc: 'Manage suppliers', icon: Building2, href: '/supplierlist', iconColor: 'text-violet-400' },
    { title: 'Debtors', desc: 'Track receivables', icon: CreditCard, href: '/debtorlist', iconColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen flex relative">
      {/* Full Page Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          className="w-full h-full object-cover opacity-90"
          src="/background-video-1.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex w-full">
      {/* Dark Sidebar (226px) */}
      <aside className="w-[226px] bg-[#2D3748] flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
        {sidebarLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = link.href === location.pathname;
            return (
              <button
                key={index}
                type="button"
                onClick={() => navigate(link.href)}
                className={`group w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? 'bg-[#03c5dc] text-white'
                    : 'text-[#03c5dc] hover:bg-[#03c5dc] hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#03c5dc] group-hover:text-white'
                }`} />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#03c5dc] group-hover:text-white'}`}>{link.title}</div>
                  <div className={`text-xs ${isActive ? 'text-white' : 'text-[#03c5dc] group-hover:text-white'}`}>{link.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[226px] bg-white/30 backdrop-blur-sm min-h-screen">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Welcome Header */}
          <div className="mb-8 bg-white/40 backdrop-blur-sm rounded-xl p-6">
            {userName && (
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userName}!</h1>
            )}
            {!userName && (
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            )}
            <p className="text-gray-600">Here's the update on your orders and payment collection today</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats and Recent Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid - 2 Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  
                  return (
                    <div
                      key={i}
                      className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Header matching Recent Orders style */}
                      <div className="px-5 py-4 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-[#111826]">{s.label}</h2>
                          <div className="p-2 rounded-lg bg-[#03c5dc]">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="px-5 py-4">
                        {s.label === 'Orders' ? (
                          <>
                            <div className="space-y-3">
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-semibold text-[#111826]">
                                  {animatedValues.ordersTotal}
                                </p>
                                <span className="text-xs text-gray-500">Total</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-xl font-medium text-[#111826]">
                                  {animatedValues.ordersPending}
                                </p>
                                <span className="text-xs text-gray-500">Pending</span>
                              </div>
                            </div>
                            <p className={`mt-4 text-xs ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {s.change} from yesterday
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-semibold text-[#111826]">
                                  {animatedValues.callsCompleted}
                                </p>
                                <span className="text-xs text-gray-500">Completed</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-xl font-medium text-[#111826]">
                                  {animatedValues.callsPending}
                                </p>
                                <span className="text-xs text-gray-500">Pending</span>
                              </div>
                            </div>
                            <p className={`mt-4 text-xs ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {s.change} from yesterday
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Recent Orders Section - Reduced Size */}
              <section className="bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200/50">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest purchase orders across teams</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/50 text-gray-600">
                  <tr className="text-left">
                        <th className="font-medium px-4 py-2 text-xs">PO ID</th>
                        <th className="font-medium px-4 py-2 text-xs">Consignee</th>
                        <th className="font-medium px-4 py-2 text-xs">Status</th>
                        <th className="font-medium px-4 py-2 text-xs text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { id: 'PO-073', consignee: 'Acme Corp', status: 'Completed', amount: '₹48,200', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { id: 'PO-072', consignee: 'Delta Traders', status: 'Pending', amount: '₹12,350', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { id: 'PO-071', consignee: 'Northbay', status: 'In Review', amount: '₹21,100', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
                  ].map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                          <td className="px-4 py-2 text-gray-900 font-medium text-xs">{r.id}</td>
                          <td className="px-4 py-2 text-gray-700 text-xs">{r.consignee}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${r.tone}`}>
                          {r.status}
                        </span>
                      </td>
                          <td className="px-4 py-2 text-right text-gray-900 font-semibold text-xs">{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-200/50 bg-gray-50/30 text-right">
              <button
                    type="button"
                onClick={() => navigate('/polist')}
                    className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800"
              >
                    View all <ArrowRight className="h-3 w-3" />
              </button>
                </div>
              </section>
            </div>

            {/* Right Column: Activity Tracker */}
            <div className="lg:col-span-1">
              <section className="bg-[#f6f6f6]/40 backdrop-blur-md border border-gray-200/50 rounded-xl overflow-hidden shadow-sm relative h-full">
                {/* Content Layer */}
                <div className="relative z-10 h-full flex flex-col">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-200/50 bg-white/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-700" />
                      <h2 className="text-sm font-semibold text-gray-900">Activities</h2>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Recent system activities</p>
          </div>

                  {/* Activity Timeline */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {activities.map((activity, index) => {
                      const Icon = activity.icon;
                      const isLast = index === activities.length - 1;
                return (
                        <div key={activity.id} className="relative flex gap-3">
                          {/* Timeline Line */}
                          {!isLast && (
                            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-300/50"></div>
                          )}
                          
                          {/* Icon */}
                          <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${activity.color} flex items-center justify-center`}>
                            <Icon className="h-4 w-4" />
                      </div>

                          {/* Content */}
                          <div className="flex-1 pb-4">
                            <p className="text-xs font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </section>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
