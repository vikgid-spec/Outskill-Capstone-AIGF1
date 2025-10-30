import { CreditCard, Search, Filter, Plus, Eye, Edit, Trash2, Phone, Calendar, MessageSquare, Play, User, Building2, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [lastDataHash, setLastDataHash] = useState<string>('');

  // Fetch debtor data using direct API call
  useEffect(() => {
    const fetchDebtors = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING DEBTORS VIA DIRECT API ===');
        
        const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/debtor_list?select=*&order=Consignee_name';
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
        
        const data = await response.json();
        console.log('=== DEBTOR FETCH SUCCESS ===');
        console.log('Data received:', data.length, 'records');
        console.log('=== END DEBTOR FETCH ===');
        
        setDebtorList(data);
        setLastDataHash(createDataHash(data));
        setLastFetchTime(new Date());
        
      } catch (err) {
        console.error('Error fetching debtors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch debtors');
      } finally {
        setLoading(false);
      }
    };

    fetchDebtors();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      if (pollingEnabled) {
        console.log('🔄 Starting automatic polling (every 10 seconds)');
        pollInterval = setInterval(() => {
          refreshDebtorData(true); // true indicates this is a polling request
        }, 10000); // Poll every 10 seconds
      }
    };

    const stopPolling = () => {
      if (pollInterval) {
        console.log('⏹️ Stopping automatic polling');
        clearInterval(pollInterval);
      }
    };

    // Handle visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    // Start polling initially
    startPolling();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollingEnabled, lastDataHash]);

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

  // Reusable refresh function
  const refreshDebtorData = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);
      
      const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/debtor_list?select=*&order=Consignee_name';
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
      
      const data = await response.json();
      const newDataHash = createDataHash(data);
      
      // Only update if data has actually changed
      if (newDataHash !== lastDataHash) {
        setDebtorList(data);
        setLastDataHash(newDataHash);
        setLastFetchTime(new Date());
        console.log('✅ Data refreshed successfully - changes detected');
      } else if (isPolling) {
        console.log('🔄 Polling check - no changes detected');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleDebtorAdded = () => {
    // Refresh the debtor list
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

  const filteredDebtors = debtorList.filter(debtor => {
    const matchesSearch = debtor.Consignee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.Consignee_Contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.phone_number.includes(searchTerm) ||
                         (debtor.payment_status && debtor.payment_status.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status.toLowerCase().includes('paid')) return 'bg-green-100 text-green-800';
    if (status.toLowerCase().includes('will pay') || status.toLowerCase().includes('promise')) return 'bg-yellow-100 text-yellow-800';
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
      <div className="flex items-center justify-between">
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
          {pollingEnabled && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live updates enabled (polling every 10s)
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setPollingEnabled(!pollingEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              pollingEnabled 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            {pollingEnabled ? '⏸️ Pause Live Updates' : '▶️ Enable Live Updates'}
          </button>
          <button 
            onClick={() => refreshDebtorData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add New Debtor
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{debtorList.length}</div>
          <div className="text-sm text-gray-600">Total Debtors</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {debtorList.filter(d => d.payment_status && d.payment_status.toLowerCase().includes('paid')).length}
          </div>
          <div className="text-sm text-gray-600">Paid</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {debtorList.filter(d => d.payment_status && d.payment_status.toLowerCase().includes('will pay')).length}
          </div>
          <div className="text-sm text-gray-600">Promised Payment</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {debtorList.filter(d => d.call_count && d.call_count > 0).length}
          </div>
          <div className="text-sm text-gray-600">With Call History</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, contact, phone, or payment status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            More Filters
          </button>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company & Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Follow-up Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Calls</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDebtors.map((debtor, index) => (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 transition-colors ${debtor.call_summary ? 'cursor-pointer' : ''}`}
                    onClick={() => debtor.call_summary && handleViewCallSummary(debtor)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {debtor.Consignee_name}
                            {debtor.call_summary && (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                <MessageSquare size={10} />
                                <span>Click to view summary</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <User size={12} />
                            {debtor.Consignee_Contact_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{debtor.phone_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(debtor.payment_status)}`}>
                        {debtor.payment_status || 'No status'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(debtor.follow_up_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{debtor.call_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {debtor.call_recording && (
                          <button 
                            className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                            title="Play Recording"
                            onClick={() => window.open(debtor.call_recording!, '_blank')}
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button 
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() => handleMakeCall(debtor, index)}
                          disabled={callingDebtor === index}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            callingDebtor === index
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
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
