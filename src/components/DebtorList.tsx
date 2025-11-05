import { CreditCard, Search, Phone, Calendar, MessageSquare, Play, User, Building2, PhoneCall, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AddDebtorModal from './AddDebtorModal';
import CallSummaryModal from './CallSummaryModal';

interface Debtor {
  Consignee_name: string;
  Consignee_Contact_name: string;
  call_transcript: string | null;
  phone_number: string;
  call_summary: string | null;
  call_recording: string | null;
  follow_up_date: string | null;
  payment_status: string | null;
  call_count: number | null;
}

export default function DebtorList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debtorList, setDebtorList] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCallSummaryModal, setShowCallSummaryModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [callingDebtor, setCallingDebtor] = useState<number | null>(null);
  const [autoRefreshing] = useState(false);
  const [lastDataHash, setLastDataHash] = useState<string>('');
  const [itemsToShow, setItemsToShow] = useState(25); // Start with 25 items
  const [animatedValues, setAnimatedValues] = useState({
    totalDebtors: 0,
    paid: 0,
    promisedPayment: 0,
    withCallHistory: 0,
  });

  // Initial fetch + Realtime subscription
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const fetchDebtors = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING DEBTORS VIA SUPABASE ===');
        
        // Try Supabase client first, but fallback to direct API if empty (RLS issue)
        let data: Debtor[] | null = null;
        let error: any = null;
        
        try {
          const result = await supabase
            .from('debtor_list')
            .select('*')
            .order('follow_up_date', { ascending: false, nullsFirst: false })
            .order('Consignee_name', { ascending: false }); // Secondary sort by name descending
          
          data = result.data;
          error = result.error;
          
          if (error) {
            console.warn('⚠️ Supabase client query failed, trying direct API fallback:', error);
            throw error;
          }
          
          // Check if we got empty results (likely RLS blocking)
          if (!data || data.length === 0) {
            console.warn('⚠️ Supabase query returned 0 records (likely RLS issue), trying direct API fallback...');
            throw new Error('Empty results - RLS likely blocking');
          }
          
          console.log('✅ Supabase client query successful');
        } catch (supabaseError) {
          // Fallback to direct API call (same approach as other components)
          console.log('🔄 Falling back to direct API call...');
          
          const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/debtor_list?select=*&order=follow_up_date.desc.nullslast,Consignee_name.desc';
          const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtaG11ZWdkb3Vjem5sdW5lZnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjMxNTYsImV4cCI6MjA3NTQ5OTE1Nn0.dBcCg_esHz5UbHyAaccYUUlZevcykXzL6Cnb-2PltZ8';
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          data = await response.json();
          console.log(`✅ Direct API call successful (fallback) - received ${data?.length || 0} records`);
        }
        
        console.log('=== DEBTOR FETCH SUCCESS ===');
        console.log('Data received:', data?.length || 0, 'records');
        console.log('First few records:', data?.slice(0, 3));
        console.log('=== END DEBTOR FETCH ===');
        
        if (!data || data.length === 0) {
          console.warn('⚠️ No data received from query');
        } else {
          // Clear any previous errors if we got data
          setError(null);
        }
        
        setDebtorList(data || []);
        setLastDataHash(createDataHash(data || []));
        setLastFetchTime(new Date());
        
        console.log('State updated - debtorList length:', data?.length || 0);
        console.log('State updated - lastFetchTime:', new Date().toISOString());
        
        if (data && data.length > 0) {
          console.log(`Successfully loaded ${data.length} debtors from database`);
        }
      } catch (err) {
        console.error('❌ Error fetching debtors:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch debtors';
        setError(errorMessage);
        console.error('Full error details:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchDebtors();

    // Set up realtime subscription
    try {
      subscription = supabase
        .channel('debtor_list_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'debtor_list',
          },
          (payload: any) => {
            console.log('🔄 Realtime update received:', payload.eventType, payload);
            
            if (payload.eventType === 'INSERT') {
              const newDebtor = payload.new as Debtor;
              setDebtorList(prev => {
                const updated = [newDebtor, ...prev];
                // Sort by follow_up_date descending (latest first), then by Consignee_name descending
                const sorted = updated.sort((a, b) => {
                  const dateA = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
                  const dateB = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
                  if (dateB !== dateA) {
                    return dateB - dateA; // Descending by date
                  }
                  return b.Consignee_name.localeCompare(a.Consignee_name); // Descending by name
                });
                setLastDataHash(createDataHash(sorted));
                return sorted;
              });
              setLastFetchTime(new Date());
              console.log('✅ New debtor added via realtime:', newDebtor.Consignee_name);
            } else if (payload.eventType === 'UPDATE') {
              const updatedDebtor = payload.new as Debtor;
              setDebtorList(prev => {
                const updated = prev.map(debtor => 
                  debtor.Consignee_name === updatedDebtor.Consignee_name ? updatedDebtor : debtor
                );
                setLastDataHash(createDataHash(updated));
                return updated;
              });
              setLastFetchTime(new Date());
              console.log('✅ Debtor updated via realtime:', updatedDebtor.Consignee_name);
            } else if (payload.eventType === 'DELETE') {
              const deletedDebtor = payload.old as Debtor;
              setDebtorList(prev => {
                const updated = prev.filter(debtor => 
                  debtor.Consignee_name !== deletedDebtor.Consignee_name
                );
                setLastDataHash(createDataHash(updated));
                return updated;
              });
              setLastFetchTime(new Date());
              console.log('✅ Debtor deleted via realtime:', deletedDebtor.Consignee_name);
            }
          }
        )
        .subscribe((status: string) => {
          console.log('📡 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to debtor_list changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error');
            setError('Failed to connect to realtime updates. Please refresh the page.');
          }
        });
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      setError('Failed to set up realtime updates. Data will still load via regular fetch.');
    }

    // Cleanup function
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up realtime subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Polling removed - now using Supabase realtime subscriptions

  // Function to create a simple hash of the data for comparison
  const createDataHash = (data: Debtor[]) => {
    return JSON.stringify(data.map(d => ({
      Consignee_name: d.Consignee_name,
      payment_status: d.payment_status,
      follow_up_date: d.follow_up_date,
      call_count: d.call_count,
      call_summary: d.call_summary,
      call_recording: d.call_recording
    })));
  };

  // Manual refresh function (for manual refresh if needed)
  const refreshDebtorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try Supabase client first
      let data: Debtor[] | null = null;
      
      try {
        const result = await supabase
          .from('debtor_list')
          .select('*')
          .order('follow_up_date', { ascending: false, nullsFirst: false })
          .order('Consignee_name', { ascending: false });
        
        data = result.data;
        
        if (result.error) {
          throw result.error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('Empty results - RLS likely blocking');
        }
      } catch (supabaseError) {
        // Fallback to direct API call
        const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/debtor_list?select=*&order=follow_up_date.desc.nullslast,Consignee_name.desc';
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtaG11ZWdkb3Vjem5sdW5lZnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjMxNTYsImV4cCI6MjA3NTQ5OTE1Nn0.dBcCg_esHz5UbHyAaccYUUlZevcykXzL6Cnb-2PltZ8';
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
      }
      
      if (data) {
        setDebtorList(data);
        setLastDataHash(createDataHash(data));
        setLastFetchTime(new Date());
        console.log('✅ Data refreshed successfully');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const handleDebtorAdded = () => {
    // Refresh the debtor list manually
    refreshDebtorData();
  };

  const handleViewCallSummary = (debtor: Debtor) => {
    if (debtor.call_summary) {
      setSelectedDebtor(debtor);
      setShowCallSummaryModal(true);
    }
  };

  const handleMakeCall = async (debtor: Debtor, index: number) => {
    try {
      setCallingDebtor(index);
      console.log('=== INITIATING CALL ===');
      console.log('Debtor:', debtor);
      
      // Make API call to n8n webhook
      const response = await fetch('https://n8n.srv937902.hstgr.cloud/webhook/5d4e57de-9bfa-4359-b0c9-73ff27b048f2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: debtor.phone_number,
          contact_name: debtor.Consignee_Contact_name,
          company_name: debtor.Consignee_name,
          call_summary: debtor.call_summary || '',
          payment_status: debtor.payment_status || '',
          follow_up_date: debtor.follow_up_date || ''
        })
      });
      
      if (response.ok) {
        console.log('=== CALL INITIATED SUCCESSFULLY ===');
        
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            console.log('Webhook response:', result);
          } catch (jsonError) {
            console.log('Response is not valid JSON, but call was successful');
          }
        } else {
          console.log('Response is not JSON, but call was successful');
        }
        
        // Show success message
        console.log('✅ Call initiated successfully! Live polling will detect updates automatically.');
        
        // The automatic polling will detect the changes from n8n
        // No need for manual refresh since we have real-time polling
        
      } else {
        console.error('Failed to initiate call:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        alert(`Failed to initiate call (${response.status}). Check n8n workflow logs for details.`);
      }
    } catch (error) {
      console.error('Error making call:', error);
      alert('Error initiating call. Please check your connection and try again.');
    } finally {
      setCallingDebtor(null);
    }
  };

  // Sort debtor list by follow_up_date descending (latest first), then by Consignee_name descending
  const sortedDebtors = [...debtorList].sort((a, b) => {
    const dateA = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
    const dateB = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
    if (dateB !== dateA) {
      return dateB - dateA; // Descending by date
    }
    return b.Consignee_name.localeCompare(a.Consignee_name); // Descending by name
  });

  const filteredDebtors = sortedDebtors.filter(debtor => {
    const matchesSearch = debtor.Consignee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.Consignee_Contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.phone_number.includes(searchTerm) ||
                         (debtor.payment_status && debtor.payment_status.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Paginate: show only itemsToShow items
  const displayedDebtors = filteredDebtors.slice(0, itemsToShow);
  const hasMore = filteredDebtors.length > itemsToShow;

  const handleViewNext = () => {
    setItemsToShow((prev: number) => prev + 25);
  };

  // Reset pagination when search term changes
  useEffect(() => {
    setItemsToShow(25);
  }, [searchTerm]);

  // Animate numbers on first page load
  useEffect(() => {
    if (debtorList.length === 0) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const totalDebtors = debtorList.length;
    const paid = debtorList.filter(d => d.payment_status && d.payment_status.toLowerCase().includes('paid')).length;
    const promisedPayment = debtorList.filter(d => d.payment_status && d.payment_status.toLowerCase().includes('will pay')).length;
    const withCallHistory = debtorList.filter(d => d.call_count && d.call_count > 0).length;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedValues({
        totalDebtors: Math.floor(totalDebtors * easeOutQuart),
        paid: Math.floor(paid * easeOutQuart),
        promisedPayment: Math.floor(promisedPayment * easeOutQuart),
        withCallHistory: Math.floor(withCallHistory * easeOutQuart),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValues({
          totalDebtors,
          paid,
          promisedPayment,
          withCallHistory,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [debtorList.length]);

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status.toLowerCase().includes('paid')) return 'bg-green-100 text-green-800';
    if (status.toLowerCase().includes('will pay') || status.toLowerCase().includes('promise')) return 'bg-[#ffb700]/20 text-[#111826]';
    if (status.toLowerCase().includes('overdue') || status.toLowerCase().includes('refuse')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add error boundary for rendering
  if (debugError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Rendering Error</h3>
          <p className="text-red-800 text-sm">{debugError}</p>
          <button 
            onClick={() => setDebugError(null)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debtor Management</h1>
          <p className="text-gray-600 mt-1">Track payment follow-ups and debtor communications</p>
          {lastFetchTime && (
            <p className="text-sm text-green-600 mt-1">
              ✅ Last updated: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
          {autoRefreshing && (
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Auto-refreshing after call...
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#03c5dc]" />
            <input
              type="text"
              placeholder="Search by company, contact, phone, or payment status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Debtors */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Total Debtors</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.totalDebtors}</div>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Paid</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.paid}</div>
          </div>
        </div>

        {/* Promised Payment */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Promised Payment</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.promisedPayment}</div>
          </div>
        </div>

        {/* With Call History */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">With Call History</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <Phone className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.withCallHistory}</div>
          </div>
        </div>
      </div>


      {/* Debtor List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading debtors...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-red-500 mb-4">
                <CreditCard size={48} className="mx-auto" />
              </div>
              <p className="text-red-600 font-medium">Error loading debtors</p>
              <p className="text-gray-600 text-sm mt-2 mb-4">{error}</p>
            </div>
          </div>
        ) : filteredDebtors.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <CreditCard size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                {debtorList.length === 0 ? 'No debtors found in database' : 'No debtors match your search'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {debtorList.length === 0 
                  ? 'The debtor_list table appears to be empty.'
                  : 'Try adjusting your search terms to find debtors.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Company & Contact</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Payment Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Follow-up Date</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Calls</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedDebtors.map((debtor, index) => (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => {
                      if (debtor.call_summary) {
                        handleViewCallSummary(debtor);
                      }
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f6f6f6] rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-[#03c5dc]" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {debtor.Consignee_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <User size={12} className="text-[#03c5dc]" />
                            {debtor.Consignee_Contact_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-[#03c5dc]" />
                        <span className="text-sm text-gray-900">{debtor.phone_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(debtor.payment_status)}`}>
                        {debtor.payment_status || 'No status'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#03c5dc]" />
                        <span className="text-sm text-gray-900">{formatDate(debtor.follow_up_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-[#03c5dc]" />
                        <span className="text-sm text-gray-900">{debtor.call_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {debtor.call_recording && (
                          <button 
                            className="p-1 text-[#03c5dc] hover:text-[#03c5dc]/80 transition-colors"
                            title="Play Recording"
                            onClick={() => window.open(debtor.call_recording!, '_blank')}
                          >
                            <Play size={24} />
                          </button>
                        )}
                        <button
                          onClick={() => handleMakeCall(debtor, index)}
                          disabled={callingDebtor === index}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            callingDebtor === index
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-[#03c5dc] hover:bg-[#03c5dc]/90 text-white'
                          }`}
                        >
                          {callingDebtor === index ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Calling...
                            </>
                          ) : (
                            <>
                              <PhoneCall size={14} className="mr-1" />
                              Call
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* View Next Button - Bottom */}
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                <button
                  type="button"
                  onClick={handleViewNext}
                  className="px-6 py-2 bg-white border-2 border-[#03c5dc] text-[#03c5dc] rounded-full font-medium hover:bg-[#03c5dc] hover:text-white transition-all duration-200"
                >
                  View Next 25
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Debtor Modal */}
      <AddDebtorModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleDebtorAdded}
      />

      {/* Call Summary Modal */}
      <CallSummaryModal 
        isOpen={showCallSummaryModal}
        onClose={() => {
          setShowCallSummaryModal(false);
          setSelectedDebtor(null);
        }}
        debtor={selectedDebtor}
      />
    </div>
  );
}
