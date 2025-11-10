import { Package, Users, Building2, LogOut, ArrowRight, CreditCard, LayoutDashboard, MessageSquare, Mail, Phone, Activity, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '../assets/Logo without tagline-darkBG.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type RecentOrder = {
  PO_ID: string;
  Mill_name: string | null;
  Consignee_name: string | null;
  Outgoing_order_timestamp: string | null;
};

const parseSupabaseTimestamp = (value: string | null) => {
  if (!value) return null;
  let normalized = value.trim();
  if (normalized.includes(' ')) {
    normalized = normalized.replace(' ', 'T');
  }

  normalized = normalized.replace(/\.(\d{3})\d*/, '.$1');

  const hasOffset = /([+-]\d{2}:?\d{2})|Z$/i.test(normalized);
  if (!hasOffset) {
    normalized = `${normalized}Z`;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type OrderMetrics = {
  today: number;
  yesterday: number;
};

type CallMetrics = {
  today: number;
  yesterday: number;
};

type LatestCallInfo = {
  callId: string | null;
  direction: 'inbound' | 'outbound' | null;
  toNumber: string | null;
  fromNumber: string | null;
  status: string | null;
  durationMs: number | null;
  agentName: string | null;
  timestamp: string | null;
};

type ActivityType = 'call' | 'followup' | 'demo' | 'waitlist' | 'order';

type ActivityEntry = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
};

export default function Dashboard() {
  // Set page title
  useEffect(() => {
    document.title = 'Dashboard | SiMBly';
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>({ today: 0, yesterday: 0 });
  const [orderMetricsLoaded, setOrderMetricsLoaded] = useState(false);
  const [orderMetricsError, setOrderMetricsError] = useState<string | null>(null);

  const [callMetrics, setCallMetrics] = useState<CallMetrics>({ today: 0, yesterday: 0 });
  const [callMetricsLoaded, setCallMetricsLoaded] = useState(false);
  const [callMetricsError, setCallMetricsError] = useState<string | null>(null);
  const [latestCall, setLatestCall] = useState<LatestCallInfo | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityEntry[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [activityRefreshCounter, setActivityRefreshCounter] = useState(0);

  const ACTIVITY_ICON_MAP: Record<ActivityType, { icon: LucideIcon; bg: string; fg: string }> = {
    call: { icon: Phone, bg: 'bg-purple-50', fg: 'text-purple-600' },
    followup: { icon: Calendar, bg: 'bg-amber-50', fg: 'text-amber-600' },
    demo: { icon: Mail, bg: 'bg-sky-50', fg: 'text-sky-600' },
    waitlist: { icon: Users, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  order: { icon: MessageSquare, bg: 'bg-green-50', fg: 'text-green-600' },
  };

  const formatRelativeTime = (date: Date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const divisions = [
      { amount: 60, unit: 'second' as const },
      { amount: 60, unit: 'minute' as const },
      { amount: 24, unit: 'hour' as const },
      { amount: 7, unit: 'day' as const },
      { amount: 4.34524, unit: 'week' as const },
      { amount: 12, unit: 'month' as const },
      { amount: Number.POSITIVE_INFINITY, unit: 'year' as const },
    ];
    let duration = (date.getTime() - Date.now()) / 1000;
    for (const division of divisions) {
      if (Math.abs(duration) < division.amount) {
        return rtf.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }
    return rtf.format(0, 'second');
  };

  const formatDuration = (durationMs: number | null) => {
    if (!durationMs || durationMs <= 0) return null;
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  };

  const formatDateLabel = (date: Date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

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

  // Fetch latest five purchase orders
const loadRecentOrders = useCallback(async () => {
  setRecentOrdersLoading(true);
  try {
    const { data, error } = await supabase
      .from('Purchase_Order_List')
      .select('PO_ID,Mill_name,Consignee_name,Outgoing_order_timestamp')
      .order('Outgoing_order_timestamp', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      throw error || new Error('No recent orders found');
    }

    setRecentOrders(data);
  } catch (clientError) {
    try {
      const apiUrl =
        'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Purchase_Order_List' +
        '?select=PO_ID,Mill_name,Consignee_name,Outgoing_order_timestamp' +
        '&order=Outgoing_order_timestamp.desc&limit=5';
      const apiKey =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtaG11ZWdkb3Vjem5sdW5lZnRtIiwicm9zIjoiYW5vbiIsImlhdCI6MTc1OTkyMzE1NiwiaXNzIjoic3VwYWJhY2FzZSIsImV4cCI6MjA3NTQ5OTE1Nn0.dBcCg_esHz5UbHyAaccYUUlZevcykXzL6Cnb-2PltZ8';

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as RecentOrder[];
      setRecentOrders(data);
    } catch (fallbackError) {
      console.error('Unable to load recent orders:', fallbackError);
      setRecentOrders([]);
    }
  } finally {
    setRecentOrdersLoading(false);
  }
}, []);

  useEffect(() => {
  loadRecentOrders();
}, [loadRecentOrders]);

  const loadOrderMetrics = useCallback(async () => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowUtc = new Date();
    const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);

    const istStartOfToday = new Date(
      Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
    );
    const todayStartUtc = new Date(istStartOfToday.getTime() - IST_OFFSET_MS);
    const nowUtcTimestamp = nowUtc.getTime();
    const yesterdayStartUtc = new Date(todayStartUtc.getTime() - 24 * 60 * 60 * 1000);

    const computeMetrics = (orders: { Outgoing_order_timestamp: string | null }[]) => {
      let todayCount = 0;
      let yesterdayCount = 0;

      orders.forEach((order) => {
        const parsed = parseSupabaseTimestamp(order.Outgoing_order_timestamp);
        if (!parsed) return;
        const ts = parsed.getTime();
        if (ts >= todayStartUtc.getTime() && ts <= nowUtcTimestamp) {
          todayCount += 1;
        } else if (ts >= yesterdayStartUtc.getTime() && ts < todayStartUtc.getTime()) {
          yesterdayCount += 1;
        }
      });

      setOrderMetrics({
        today: todayCount,
        yesterday: yesterdayCount,
      });
      setOrderMetricsLoaded(true);
    };

    setOrderMetricsError(null);
    try {
      const { data, error } = await supabase
        .from('Purchase_Order_List')
        .select('Outgoing_order_timestamp');

      if (error || !data) {
        throw error || new Error('Unable to fetch orders');
      }

      computeMetrics(data);
    } catch (clientError) {
      try {
        const baseUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Purchase_Order_List';
        const apiKey =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtaG11ZWdkb3Vjem5sdW5lZnRtIiwicm9zIjoiYW5vbiIsImlhdCI6MTc1OTkyMzE1NiwiaXNzIjoic3VwYWJhY2FzZSIsImV4cCI6MjA3NTQ5OTE1Nn0.dBcCg_esHz5UbHyAaccYUUlZevcykXzL6Cnb-2PltZ8';

        const response = await fetch(
          `${baseUrl}?select=PO_ID,Outgoing_order_timestamp&order=Outgoing_order_timestamp.desc&limit=2000`,
          {
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const orders = (await response.json()) as { Outgoing_order_timestamp: string | null }[];
        computeMetrics(orders);
      } catch (fallbackError) {
        console.error('Unable to load order metrics:', fallbackError);
        setOrderMetrics({ today: 0, yesterday: 0 });
        setOrderMetricsLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    loadOrderMetrics();
  }, [loadOrderMetrics]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-order-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Purchase_Order_List' },
        () => {
          loadOrderMetrics();
          loadRecentOrders();
          setActivityRefreshCounter((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrderMetrics, loadRecentOrders]);

  useEffect(() => {
    const fetchCallMetrics = async () => {
      setCallMetricsError(null);
      try {
        const response = await fetch('/api/retellCallStats');
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload?.error || 'Failed to fetch call metrics');
        }

        const payload = await response.json();
        setCallMetrics({
          today: typeof payload.today === 'number' ? payload.today : 0,
          yesterday: typeof payload.yesterday === 'number' ? payload.yesterday : 0,
        });
        setLatestCall(
          payload?.latestCall
            ? {
                callId: payload.latestCall.callId ?? null,
                direction: payload.latestCall.direction ?? null,
                toNumber: payload.latestCall.toNumber ?? null,
                fromNumber: payload.latestCall.fromNumber ?? null,
                status: payload.latestCall.status ?? null,
                durationMs:
                  typeof payload.latestCall.durationMs === 'number' ? payload.latestCall.durationMs : null,
                agentName: payload.latestCall.agentName ?? null,
                timestamp: payload.latestCall.timestamp ?? null,
              }
            : null
        );
      } catch (error) {
        console.error('Error fetching call metrics:', error);
        const message = error instanceof Error ? error.message : 'Unable to load call metrics';
        setCallMetricsError(message);
        setLatestCall(null);
      } finally {
        setCallMetricsLoaded(true);
      }
    };

    fetchCallMetrics();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);

      try {
        const [ordersResult, followUpResult, demoResult, waitlistResult, waitlistEntries] = await Promise.all([
          supabase
            .from('Purchase_Order_List')
            .select('PO_ID,Consignee_name,Mill_name,Outgoing_order_timestamp,Incoming_order_timestamp')
            .order('Outgoing_order_timestamp', { ascending: false })
            .limit(1),
          supabase
            .from('debtor_list')
            .select('Consignee_name,Consignee_Contact_name,payment_status,follow_up_date')
            .not('follow_up_date', 'is', null)
            .order('follow_up_date', { ascending: false })
            .limit(1),
          supabase
            .from('demo_requests')
            .select('full_name,company_name,preferred_time')
            .order('preferred_time', { ascending: false })
            .limit(1),
          supabase
            .from('join_waitlist')
            .select('full_name,company_name,notify,joined_at')
            .order('joined_at', { ascending: false })
            .limit(1),
          supabase
            .from('join_waitlist')
            .select('full_name,company_name,notify,joined_at')
            .order('joined_at', { ascending: false })
            .limit(5),
        ]);

        const items: ActivityEntry[] = [];

        if (ordersResult.error) {
          throw ordersResult.error;
        }
        const latestOrder = ordersResult.data?.[0];
        if (latestOrder?.Outgoing_order_timestamp) {
          const sentAt =
            parseSupabaseTimestamp(latestOrder.Outgoing_order_timestamp) ??
            new Date(`${latestOrder.Outgoing_order_timestamp}Z`);
          if (!Number.isNaN(sentAt.getTime())) {
            items.push({
              id: `order-${latestOrder.PO_ID}-${sentAt.getTime()}`,
              type: 'order',
              title: `PO ${latestOrder.PO_ID} sent`,
              description: [
                latestOrder.Consignee_name ? `Consignee: ${latestOrder.Consignee_name}` : null,
                latestOrder.Mill_name ? `Mill: ${latestOrder.Mill_name}` : null,
                `Sent on ${formatDateLabel(sentAt)}`,
              ]
                .filter(Boolean)
                .join(' · '),
              timestamp: sentAt,
            });
          }
        }

        if (latestCall && latestCall.timestamp) {
          const callTimestamp = new Date(latestCall.timestamp);
          if (!Number.isNaN(callTimestamp.getTime())) {
            const durationLabel = formatDuration(latestCall.durationMs);
            const directionLabel =
              latestCall.direction === 'inbound'
                ? 'Inbound call'
                : latestCall.direction === 'outbound'
                ? 'Outbound call'
                : 'Call';

            items.push({
              id: `call-${latestCall.timestamp}`,
              type: 'call',
              title: `${directionLabel} completed`,
              description: [
                latestCall.direction === 'outbound' ? `To ${latestCall.toNumber || 'unknown number'}` : '',
                latestCall.direction === 'inbound' ? `From ${latestCall.fromNumber || 'unknown number'}` : '',
                durationLabel ? `Duration ${durationLabel}` : '',
              ]
                .filter(Boolean)
                .join(' · '),
              timestamp: callTimestamp,
            });
          }
        }

        if (followUpResult.error) {
          throw followUpResult.error;
        }
        const followUpData = followUpResult.data?.[0];
        if (followUpData?.follow_up_date) {
          const followUpDate =
            parseSupabaseTimestamp(followUpData.follow_up_date) ?? new Date(followUpData.follow_up_date);
          if (!Number.isNaN(followUpDate.getTime())) {
            const eventTimestamp = followUpDate.getTime() <= Date.now() ? followUpDate : new Date();
            items.push({
              id: `followup-${followUpDate.getTime()}`,
              type: 'followup',
              title: `Follow-up scheduled for ${followUpData.Consignee_name}`,
              description: [
                followUpData.Consignee_Contact_name ? `Contact: ${followUpData.Consignee_Contact_name}` : null,
                followUpData.payment_status ? `Status: ${followUpData.payment_status}` : null,
                `Follow-up on ${formatDateLabel(followUpDate)}`,
              ]
                .filter(Boolean)
                .join(' · '),
              timestamp: eventTimestamp,
            });
          }
        }

        if (demoResult.error) {
          throw demoResult.error;
        }
        const demoData = demoResult.data?.[0];
        if (demoData) {
          const preferredTime = demoData.preferred_time
            ? parseSupabaseTimestamp(demoData.preferred_time) ?? new Date(demoData.preferred_time)
            : null;
          const timestamp = preferredTime && !Number.isNaN(preferredTime.getTime()) ? preferredTime : new Date();
          items.push({
            id: `demo-${timestamp.getTime()}`,
            type: 'demo',
            title: 'New demo request received',
            description: [
              demoData.full_name,
              demoData.company_name,
              preferredTime && !Number.isNaN(preferredTime.getTime())
                ? `Preferred: ${formatDateLabel(preferredTime)}`
                : 'Preferred time not set',
            ]
              .filter(Boolean)
              .join(' · ') || 'New inbound request',
            timestamp,
          });
        }

        if (waitlistResult.error || waitlistEntries.error) {
          throw waitlistResult.error || waitlistEntries.error;
        }

        const waitlistRecords = waitlistEntries.data ?? [];
        for (const waitlistData of waitlistRecords) {
          if (!waitlistData?.joined_at) continue;
          const joinedAt =
            parseSupabaseTimestamp(waitlistData.joined_at) ?? new Date(waitlistData.joined_at);
          if (Number.isNaN(joinedAt.getTime())) continue;

          items.push({
            id: `waitlist-${joinedAt.getTime()}-${waitlistData.full_name ?? ''}`,
            type: 'waitlist',
            title: 'Waitlist signup',
            description: [
              waitlistData.full_name || 'New contact',
              waitlistData.company_name,
              `Joined at ${formatDateLabel(joinedAt)}`,
              typeof waitlistData.notify === 'boolean' ? `Notify on launch: ${waitlistData.notify ? 'Yes' : 'No'}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            timestamp: joinedAt,
          });
        }

        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivityItems(items.slice(0, 4));
      } catch (error) {
        console.error('Error loading activities:', error);
        const message = error instanceof Error ? error.message : 'Failed to load recent activities';
        setActivitiesError(message);
        setActivityItems([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, [latestCall, activityRefreshCounter]);

  useEffect(() => {
    const tables = ['demo_requests', 'join_waitlist', 'debtor_list', 'Purchase_Order_List'];
    const channel = supabase.channel('dashboard-activity-updates');

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          setActivityRefreshCounter((prev) => prev + 1);
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  const orderChangeLabel = orderMetricsError
    ? orderMetricsError
    : orderMetricsLoaded
    ? (() => {
        const diff = orderMetrics.today - orderMetrics.yesterday;
        if (orderMetrics.yesterday === 0) {
          if (orderMetrics.today === 0) return 'No change from yesterday';
          return '100% increase from yesterday';
        }
        const pct = (diff / Math.max(orderMetrics.yesterday, 1)) * 100;
        if (pct === 0) return 'No change from yesterday';
        return `${Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'increase' : 'decrease'} from yesterday`;
      })()
    : 'Calculating...';

  const orderChangeColor = orderMetricsError
    ? 'text-rose-600'
    : !orderMetricsLoaded
    ? 'text-gray-500'
    : orderMetrics.today > orderMetrics.yesterday
    ? 'text-emerald-600'
    : orderMetrics.today < orderMetrics.yesterday
    ? 'text-rose-600'
    : 'text-gray-500';

  const callChangeLabel = callMetricsError
    ? callMetricsError
    : callMetricsLoaded
    ? (() => {
        const diff = callMetrics.today - callMetrics.yesterday;
        if (callMetrics.yesterday === 0) {
          if (callMetrics.today === 0) return 'No change from yesterday';
          return '100% increase from yesterday';
        }
        const pct = (diff / Math.max(callMetrics.yesterday, 1)) * 100;
        if (pct === 0) return 'No change from yesterday';
        return `${Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'increase' : 'decrease'} from yesterday`;
      })()
    : 'Calculating...';

  const callChangeColor = callMetricsError
    ? 'text-rose-600'
    : !callMetricsLoaded
    ? 'text-gray-500'
    : callMetrics.today > callMetrics.yesterday
    ? 'text-emerald-600'
    : callMetrics.today < callMetrics.yesterday
    ? 'text-rose-600'
    : 'text-gray-500';

  const stats = [
    { 
      key: 'orders' as const,
      label: 'Orders today',
      subtitle: 'Orders',
      value: orderMetricsError ? null : orderMetricsLoaded ? orderMetrics.today : null,
      changeLabel: orderChangeLabel,
      changeColor: orderChangeColor,
      icon: Package, 
      tone: 'from-sky-500 to-sky-600',
      loading: !orderMetricsLoaded && !orderMetricsError,
    },
    {
      key: 'calls' as const,
      label: 'Calls today',
      subtitle: 'Calls',
      value: callMetricsError ? null : callMetricsLoaded ? callMetrics.today : null,
      changeLabel: callChangeLabel,
      changeColor: callChangeColor,
      icon: Phone,
      tone: 'from-emerald-500 to-emerald-600',
      loading: !callMetricsLoaded && !callMetricsError,
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
                {stats.map((card, i) => {
                  const Icon = card.icon;
                  const displayValue =
                    card.value === null || card.value === undefined
                      ? '—'
                      : card.value.toLocaleString('en-IN');
                  
                  return (
                    <div
                      key={card.key ?? i}
                      className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Header matching Recent Orders style */}
                      <div className="px-5 py-4 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-[#111826]">{card.label}</h2>
                          <div className="p-2 rounded-lg bg-[#03c5dc]">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="px-5 py-4 space-y-4">
                              <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold text-[#111826]">{displayValue}</p>
                          <span className="text-xs text-gray-500">{card.subtitle}</span>
                              </div>
                        <p className={`text-xs ${card.changeColor}`}>{card.changeLabel}</p>
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
                        <th className="font-medium px-4 py-2 text-xs">Mill</th>
                        <th className="font-medium px-4 py-2 text-xs">Consignee</th>
                        <th className="font-medium px-4 py-2 text-xs text-right">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrdersLoading ? (
                    <tr>
                      <td className="px-4 py-4 text-xs text-gray-500" colSpan={4}>
                        Loading recent orders...
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-xs text-gray-500" colSpan={4}>
                        No recent orders found.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.PO_ID} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2 text-gray-900 font-medium text-xs">
                          {order.PO_ID}
                        </td>
                        <td className="px-4 py-2 text-gray-700 text-xs">
                          {order.Mill_name || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-700 text-xs">
                          {order.Consignee_name || '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 text-xs">
                          {(() => {
                            const parsed = parseSupabaseTimestamp(order.Outgoing_order_timestamp);
                            return parsed
                              ? parsed.toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Kolkata',
                                  hour12: true,
                                })
                              : '—';
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
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
                    {activitiesLoading ? (
                      <p className="text-xs text-gray-500">Loading recent activities...</p>
                    ) : activitiesError ? (
                      <p className="text-xs text-rose-500">{activitiesError}</p>
                    ) : activityItems.length === 0 ? (
                      <p className="text-xs text-gray-500">No recent activity yet.</p>
                    ) : (
                      activityItems.map((activity, index) => {
                        const isLast = index === activityItems.length - 1;
                        const config = ACTIVITY_ICON_MAP[activity.type];
                        const IconComponent = config?.icon ?? MessageSquare;
                        const relativeTime = formatRelativeTime(activity.timestamp);

                return (
                        <div key={activity.id} className="relative flex gap-3">
                          {!isLast && (
                              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-300/50" />
                            )}
                            <div
                              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${
                                config?.bg ?? 'bg-gray-100'
                              } flex items-center justify-center`}
                            >
                              <IconComponent className={`h-4 w-4 ${config?.fg ?? 'text-gray-600'}`} />
                      </div>
                          <div className="flex-1 pb-4">
                            <p className="text-xs font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{relativeTime}</p>
                      </div>
                    </div>
                );
                      })
                    )}
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
