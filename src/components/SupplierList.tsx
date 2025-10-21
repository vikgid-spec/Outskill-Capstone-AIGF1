import { Building2, Search, Filter, Plus, Eye, Edit, Trash2, MapPin, Phone, Mail, Package, DollarSign, Star, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import AddSupplierModal from './AddSupplierModal';

interface Supplier {
  Mill_id: string;
  Mill_name: string;
  Mill_email: string;
  Mill_keywords: string;
}

export default function SupplierList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch supplier data using direct API call (same working approach as ConsigneeList)
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING SUPPLIERS VIA DIRECT API ===');
        
        // Use the same working direct API approach
        const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Hawa_MillName?select=Mill_id,Mill_name,Mill_email,Mill_keywords&order=Mill_id';
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
        console.log('=== SUPPLIER FETCH SUCCESS ===');
        console.log('Data received:', data.length, 'records');
        console.log('First few records:', data.slice(0, 3));
        console.log('=== END SUPPLIER FETCH ===');
        
        setSupplierList(data);
        setLastFetchTime(new Date());
        
        console.log('State updated - supplierList length:', data.length);
        console.log('State updated - lastFetchTime:', new Date().toISOString());
        
        if (data.length > 0) {
          console.log(`Successfully loaded ${data.length} suppliers from database`);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Debug: Log when supplierList state changes
  useEffect(() => {
    console.log('=== SUPPLIER LIST STATE CHANGED ===');
    console.log('Current supplierList length:', supplierList.length);
    console.log('Current supplierList:', supplierList);
    console.log('=== END STATE LOG ===');
  }, [supplierList]);

  const handleSupplierAdded = () => {
    // Refresh the supplier list
    const refreshData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Hawa_MillName?select=Mill_id,Mill_name,Mill_email,Mill_keywords&order=Mill_id';
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
        setSupplierList(data);
        setLastFetchTime(new Date());
      } catch (err) {
        console.error('Refresh error:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh');
      } finally {
        setLoading(false);
      }
    };
    
    refreshData();
  };

  const filteredSuppliers = supplierList.filter(supplier => {
    const matchesSearch = supplier.Mill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.Mill_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.Mill_keywords.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your supplier network and vendor relationships</p>
          {lastFetchTime && (
            <p className="text-sm text-green-600 mt-1">
              ✅ Last updated: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              console.log('=== MANUAL SUPPLIER REFRESH VIA DIRECT API ===');
              try {
                setLoading(true);
                setError(null);
                
                // Use the same working direct API approach
                const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Hawa_MillName?select=Mill_id,Mill_name,Mill_email,Mill_keywords&order=Mill_id';
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
                console.log('=== SUPPLIER REFRESH SUCCESS ===');
                console.log('Refreshed data:', data.length, 'records');
                console.log('First few records:', data.slice(0, 3));
                console.log('=== END SUPPLIER REFRESH ===');
                
                setSupplierList(data);
                setLastFetchTime(new Date());
              } catch (err) {
                console.error('Supplier refresh error:', err);
                setError(err instanceof Error ? err.message : 'Failed to refresh');
              } finally {
                setLoading(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add New Supplier
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{supplierList.length}</div>
          <div className="text-sm text-gray-600">Total Suppliers</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {supplierList.filter(s => s.Mill_email && s.Mill_email !== '').length}
          </div>
          <div className="text-sm text-gray-600">With Email</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {supplierList.filter(s => s.Mill_keywords && s.Mill_keywords !== '').length}
          </div>
          <div className="text-sm text-gray-600">With Keywords</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(supplierList.map(s => s.Mill_name?.substring(0, 2))).size}
          </div>
          <div className="text-sm text-gray-600">Regions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or keywords..."
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

      {/* Supplier List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading suppliers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-red-500 mb-4">
                <Building2 size={48} className="mx-auto" />
              </div>
              <p className="text-red-600 font-medium">Error loading suppliers</p>
              <p className="text-gray-600 text-sm mt-2 mb-4">{error}</p>
              
              {error.includes('Row Level Security') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-yellow-800 mb-2">How to fix this:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Go to your Supabase dashboard</li>
                    <li>2. Navigate to Authentication → Policies</li>
                    <li>3. Find the Hawa_MillName table</li>
                    <li>4. Create a policy to allow SELECT for anonymous users, or</li>
                    <li>5. Disable RLS temporarily for testing</li>
                  </ol>
                  <p className="text-xs text-yellow-600 mt-2">
                    Alternatively, use a service role key instead of the anon key.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <Building2 size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                {supplierList.length === 0 ? 'No suppliers found in database' : 'No suppliers match your search'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {supplierList.length === 0 
                  ? 'The Hawa_MillName table appears to be empty. Please add some data to see it here.'
                  : 'Try adjusting your search terms to find suppliers.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mill Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Keywords</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.Mill_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.Mill_name}</div>
                          <div className="text-xs text-gray-500">{supplier.Mill_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-gray-900">
                          {supplier.Mill_email || 'No email provided'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <span className="text-gray-900 break-words">
                          {supplier.Mill_keywords || 'No keywords provided'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
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

      {/* Add Supplier Modal */}
      <AddSupplierModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSupplierAdded}
      />
    </div>
  );
}
