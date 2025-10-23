import { Package, Search, Filter, Plus, Eye, CreditCard as Edit, Trash2, Calendar, User, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PO {
  PO_ID: string;
  Mill_name: string;
  Consignee_name: string;
  Incoming_order_timestamp: string;
  Outgoing_order_timestamp: string;
}

export default function POList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [poList, setPoList] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [downloadingPOs, setDownloadingPOs] = useState<Set<string>>(new Set());
  const [pdfStatus, setPdfStatus] = useState<Map<string, boolean>>(new Map());

  // Fetch PO data using direct API call (same working approach as other components)
  useEffect(() => {
    const fetchPOs = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING POS VIA DIRECT API ===');
        
        // Use the same working direct API approach
        const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Purchase_Order_List?select=PO_ID,Mill_name,Consignee_name,Incoming_order_timestamp,Outgoing_order_timestamp&order=PO_ID';
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
        console.log('=== PO FETCH SUCCESS ===');
        console.log('Data received:', data.length, 'records');
        console.log('First few records:', data.slice(0, 3));
        console.log('=== END PO FETCH ===');
        
        setPoList(data);
        setLastFetchTime(new Date());
        
        console.log('State updated - poList length:', data.length);
        console.log('State updated - lastFetchTime:', new Date().toISOString());
        
        if (data.length > 0) {
          console.log(`Successfully loaded ${data.length} purchase orders from database`);
        }
      } catch (err) {
        console.error('Error fetching purchase orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
      } finally {
        setLoading(false);
      }
    };

    fetchPOs();
  }, []);

  // Debug: Log when poList state changes
  useEffect(() => {
    console.log('=== PO LIST STATE CHANGED ===');
    console.log('Current poList length:', poList.length);
    console.log('Current poList:', poList);
    console.log('=== END STATE LOG ===');
  }, [poList]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Function to generate dynamic date patterns for PDF filenames
  const generateDatePatterns = (timestamp?: string) => {
    const patterns = [];
    
    // Use the provided timestamp or fall back to current date
    const baseDate = timestamp ? new Date(timestamp + 'Z') : new Date();
    
    // Generate patterns for the last 7 days (including today)
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() - i);
      
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      patterns.push(`${month} ${day}, ${year}`);
    }
    
    return patterns;
  };

  // Enhanced PDF Download function with dynamic date patterns
  const handleDownloadPDF = async (poId: string) => {
    try {
      // Add PO to downloading set
      setDownloadingPOs(prev => new Set(prev).add(poId));
      
      console.log(`🔍 Starting PDF download for PO: ${poId}`);
      
      // Skip bucket existence check since we know the bucket exists
      // and the listBuckets() function might have permission issues
      console.log('🔍 Attempting to access nonpublic bucket directly...');
      
      // Extract the numeric part from PO ID (e.g., "PO-032" -> "032")
      const numericId = poId.replace(/^PO-?/i, '');
      
      // Allow download for POs 65 and above (flexible range for future POs)
      const poNumber = parseInt(numericId);
      if (poNumber < 65) {
        throw new Error('PDF_NOT_AVAILABLE');
      }
      
      console.log(`🔍 PO-${poNumber} is in allowed range (65+), attempting download...`);
      
      // Generate dynamic date patterns for the last 7 days
      const po = poList.find(p => p.PO_ID === poId);
      const datePatterns = generateDatePatterns(po?.Incoming_order_timestamp);
      console.log('📅 Generated date patterns:', datePatterns);
      
      // Define possible file paths in the 'nonpublic' bucket
      // Using dynamic date patterns that work for any month/year
      const possiblePaths = [
        // Dynamic date patterns (most recent first)
        ...datePatterns.map(date => `Purchase Order - ${poId} -Greentex paper mill - ${date} .pdf`),
        // Fallback patterns
        `Purchase Order - ${poId} -`,
        `${poId}.pdf`,
        `PO-${numericId}.pdf`,
        `${numericId}.pdf`
      ];
      
      let foundPath = null;
      let signedUrl = null;
      
      // Skip the complex listing logic and go straight to public URL approach
      console.log(`🔍 Skipping listing approach, using public URL method directly...`);
      
      // Use signed URL approach for private bucket access
      console.log(`🔍 Using signed URL approach for private bucket...`);
      
      // Use the same dynamic date patterns for signed URLs
      const directPaths = [
        // Dynamic date patterns (most recent first)
        ...datePatterns.map(date => `Purchase Order - ${poId} -Greentex paper mill - ${date} .pdf`),
        // Fallback patterns
        `Purchase Order - ${poId} -`,
        `${poId}.pdf`,
        `PO-${numericId}.pdf`,
        `${numericId}.pdf`
      ];
      
      for (const directPath of directPaths) {
        try {
          console.log(`🔍 Trying signed URL for: ${directPath}`);
          const { data, error } = await supabase.storage
            .from('nonpublic')
            .createSignedUrl(directPath, 60);
          
          if (!error && data?.signedUrl) {
            console.log(`✅ Signed URL successful for: ${directPath}`);
            foundPath = directPath;
            signedUrl = data.signedUrl;
            break;
          } else {
            console.log(`❌ Signed URL failed for: ${directPath} - ${error?.message || 'No signed URL received'}`);
          }
        } catch (err) {
          console.log(`❌ Error with signed URL for ${directPath}:`, err);
        }
      }
      
      if (!foundPath) {
        console.log(`❌ No PDF found for ${poId} in 'nonpublic' bucket`);
        throw new Error('PDF_NOT_FOUND');
      }
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `PO-${poId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Successfully downloaded PDF for ${poId} from 'nonpublic' bucket at: ${foundPath}`);
      
      // Show success message
      alert(`✅ PDF downloaded successfully for ${poId}`);
      
    } catch (error) {
      console.error('❌ PDF download error:', error);
      
      // Handle different error types with user-friendly messages
      let userMessage = '';
      
      if (error instanceof Error) {
        if (error.message === 'PDF_NOT_AVAILABLE') {
          userMessage = `📄 PDF not available for ${poId}. Only POs 65 and above have PDFs available for download.`;
        } else if (error.message === 'PDF_NOT_FOUND') {
          userMessage = `📄 PDF not yet generated for ${poId}. The file is not found in the storage bucket. Please contact your administrator to generate the PDF.`;
        } else if (error.message.includes('SIGNED_URL_ERROR')) {
          userMessage = `⚠️ Failed to access PDF for ${poId}. Please try again or contact support.`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = `🌐 Network error. Please check your internet connection and try again.`;
        } else {
          userMessage = `❌ Failed to download PDF for ${poId}. Please try again or contact support.`;
        }
      } else {
        userMessage = `❌ An unexpected error occurred. Please try again.`;
      }
      
      alert(userMessage);
    } finally {
      // Remove PO from downloading set
      setDownloadingPOs(prev => {
        const newSet = new Set(prev);
        newSet.delete(poId);
        return newSet;
      });
    }
  };

  // Function to check if PDF exists for a PO using public URL approach
  const checkPDFExists = async (poId: string): Promise<boolean> => {
    try {
      // Extract the numeric part from PO ID (e.g., "PO-032" -> "032")
      const numericId = poId.replace(/^PO-?/i, '');
      
      // Check for POs 65 and above (flexible range for future POs)
      const poNumber = parseInt(numericId);
      if (poNumber < 65) {
        console.log(`❌ PO ${poId} not in allowed range (65+), no PDF available`);
        return false;
      }
      
      // Generate dynamic date patterns for PDF existence check
      const po = poList.find(p => p.PO_ID === poId);
      const datePatterns = generateDatePatterns(po?.Incoming_order_timestamp);
      
      const possiblePaths = [
        // Dynamic date patterns (most recent first)
        ...datePatterns.map(date => `Purchase Order - ${poId} -Greentex paper mill - ${date} .pdf`),
        // Fallback patterns
        `Purchase Order - ${poId} -`,
        `${poId}.pdf`,
        `PO-${numericId}.pdf`,
        `${numericId}.pdf`
      ];
      
      for (const filePath of possiblePaths) {
        try {
          const publicUrl = `${supabase.supabaseUrl}/storage/v1/object/public/nonpublic/${encodeURIComponent(filePath)}`;
          
          // Test if the URL is accessible with proper error handling
          const response = await fetch(publicUrl, { 
            method: 'HEAD',
            // Add headers to avoid CORS issues
            headers: {
              'Accept': 'application/pdf'
            }
          });
          
          if (response.ok) {
            console.log(`✅ PDF exists at: ${filePath}`);
            return true;
          } else if (response.status === 400 || response.status === 404) {
            // File doesn't exist, continue to next path
            console.log(`❌ PDF not found at: ${filePath} (${response.status})`);
            continue;
          } else {
            // Other errors (403, 500, etc.) - log but continue
            console.log(`⚠️ Error accessing ${filePath}: ${response.status}`);
            continue;
          }
        } catch (err) {
          // Network or other errors - log and continue to next path
          console.log(`❌ Network error checking ${filePath}:`, err);
          continue;
        }
      }
      
      console.log(`❌ No PDF found for ${poId} (POs 67-68 only)`);
      return false;
    } catch (error) {
      // Catch any unexpected errors and log them without throwing
      console.error(`Error checking PDF existence for ${poId}:`, error);
      return false;
    }
  };

  // Check PDF status for all POs when data is loaded or updated
  useEffect(() => {
    const checkAllPDFs = async () => {
      if (poList.length > 0) {
        console.log('🔍 Checking PDF status for all POs...');
        const statusMap = new Map();
        
        // Check each PO for PDF availability
        for (const po of poList) {
          const exists = await checkPDFExists(po.PO_ID);
          statusMap.set(po.PO_ID, exists);
          console.log(`PDF status for ${po.PO_ID}: ${exists ? '✅ Exists' : '❌ Not found'}`);
        }
        
        setPdfStatus(statusMap);
        console.log('✅ PDF status check completed for all POs');
      }
    };
    
    checkAllPDFs();
  }, [poList]);

  // Also check PDF status when a specific PO is being downloaded
  const checkPDFForPO = async (poId: string) => {
    try {
      const exists = await checkPDFExists(poId);
      setPdfStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(poId, exists);
        return newMap;
      });
      return exists;
    } catch (error) {
      console.error(`Error checking PDF for ${poId}:`, error);
      return false;
    }
  };

  // Make debug functions available globally for testing
  useEffect(() => {
    (window as any).debugStorage = debugNonpublicBucket;
    (window as any).testPO = testSpecificPO;
    (window as any).testDirectAccess = async () => {
      console.log('🔍 Testing direct bucket access...');
      
      // Test 1: List buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Buckets:', buckets, 'Error:', bucketError);
      
      // Test 2: List files in nonpublic
      const { data: files, error: fileError } = await supabase.storage.from('nonpublic').list('');
      console.log('Files in nonpublic:', files, 'Error:', fileError);
      
      // Test 3: Try to get signed URL for a known file
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('nonpublic')
        .createSignedUrl('Purchase Order - PO-068 -Greentex paper mill - Oct 17, 2025 .pdf', 60);
      console.log('Signed URL:', signedUrl, 'Error:', urlError);
    };
    console.log('🔧 Debug functions available: window.debugStorage(), window.testPO("068"), window.testDirectAccess()');
  }, []);

  // Debug function to test public URL access for POs 65-68 only
  const debugNonpublicBucket = async () => {
    try {
      console.log('🔍 Debugging "nonpublic" bucket for POs 65 and above...');
      
      // Test known file patterns for POs 65 and above
      const testFiles = [
        'Purchase Order - PO-072 -Greentex paper mill - Oct 19, 2025 .pdf',
        'Purchase Order - PO-071 -Greentex paper mill - Oct 19, 2025 .pdf',
        'Purchase Order - PO-070 -Greentex paper mill - Oct 19, 2025 .pdf',
        'Purchase Order - PO-068 -Greentex paper mill - Oct 17, 2025 .pdf',
        'Purchase Order - PO-067 -Greentex paper mill - Oct 17, 2025 .pdf',
        'Purchase Order - PO-066 -Greentex paper mill - Oct 17, 2025 .pdf',
        'Purchase Order - PO-065 -Greentex paper mill - Oct 17, 2025 .pdf',
        'PO-072.pdf',
        'PO-071.pdf',
        'PO-070.pdf',
        'PO-068.pdf',
        'PO-067.pdf',
        'PO-066.pdf',
        'PO-065.pdf'
      ];
      // Use signed URL approach for private bucket
      for (const fileName of testFiles) {
          console.log(`🔍 Testing signed URL for: ${fileName}`);
          const { data, error } = await supabase.storage
            .from('nonpublic')
            .createSignedUrl(fileName, 60);
          
          if (!error && data?.signedUrl) {
            console.log(`✅ Found: ${fileName}`);
          } else {
            console.log(`❌ Not found: ${fileName} - ${error?.message || 'No signed URL received'}`);
          }
      }
      
    } catch (error) {
      console.error('❌ Debug error for nonpublic bucket:', error);
    }
  };

  // Test function for a specific PO ID
  const testSpecificPO = async (poId: string) => {
    console.log(`🧪 Testing PDF download for PO-${poId} in nonpublic bucket...`);
    
    const testPaths = [
      `${poId}.pdf`,
      `PO-${poId}.pdf`,
      `purchase-orders/${poId}.pdf`,
      `purchase-orders/PO-${poId}.pdf`,
    ];
    
    for (const path of testPaths) {
      try {
        console.log(`Testing path: ${path}`);
        const { data, error } = await supabase.storage
          .from('nonpublic')
          .createSignedUrl(path, 60);
        
        if (error) {
          console.log(`❌ ${path}: ${error.message}`);
        } else {
          console.log(`✅ ${path}: Success!`);
          return path;
        }
      } catch (err) {
        console.log(`❌ ${path}: ${err}`);
      }
    }
    
    console.log(`❌ No valid path found for PO-${poId}`);
    return null;
  };

  const filteredPOs = poList.filter(po => {
    const matchesSearch = po.PO_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.Mill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (po.Consignee_name && po.Consignee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track all your purchase orders</p>
          {lastFetchTime && (
            <p className="text-sm text-green-600 mt-1">
              ✅ Last updated: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              console.log('=== MANUAL PO REFRESH VIA DIRECT API ===');
              try {
                setLoading(true);
                setError(null);
                
                // Use the same working direct API approach
                const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Purchase_Order_List?select=PO_ID,Mill_name,Consignee_name,Incoming_order_timestamp,Outgoing_order_timestamp&order=PO_ID';
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
                console.log('=== PO REFRESH SUCCESS ===');
                console.log('Refreshed data:', data.length, 'records');
                console.log('First few records:', data.slice(0, 3));
                console.log('=== END PO REFRESH ===');
                
                setPoList(data);
                setLastFetchTime(new Date());
                
                // Re-check PDF status for all POs after refresh
                console.log('🔄 Re-checking PDF status after refresh...');
                const statusMap = new Map();
                for (const po of data) {
                  const exists = await checkPDFExists(po.PO_ID);
                  statusMap.set(po.PO_ID, exists);
                  console.log(`PDF status for ${po.PO_ID}: ${exists ? '✅ Exists' : '❌ Not found'}`);
                }
                setPdfStatus(statusMap);
              } catch (err) {
                console.error('PO refresh error:', err);
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
            onClick={async () => {
              console.log('🔄 Manually refreshing PDF status...');
              if (poList.length > 0) {
                const statusMap = new Map();
                for (const po of poList) {
                  const exists = await checkPDFExists(po.PO_ID);
                  statusMap.set(po.PO_ID, exists);
                  console.log(`PDF status for ${po.PO_ID}: ${exists ? '✅ Exists' : '❌ Not found'}`);
                }
                setPdfStatus(statusMap);
                alert('✅ PDF status refreshed for all POs');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Refresh PDF Status
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg">
            <Plus size={20} />
            Create New PO
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{poList.length}</div>
          <div className="text-sm text-gray-600">Total POs</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {poList.length > 0 ? poList.length : 0}
          </div>
          <div className="text-sm text-gray-600">Active Orders</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {new Set(poList.map(po => po.Mill_name)).size}
          </div>
          <div className="text-sm text-gray-600">Unique Mills</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO ID, Mill name, or Consignee..."
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

      {/* PO List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-red-500 mb-4">
                <Package size={48} className="mx-auto" />
              </div>
              <p className="text-red-600 font-medium">Error loading purchase orders</p>
              <p className="text-gray-600 text-sm mt-2 mb-4">{error}</p>
              
              {error.includes('Row Level Security') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-yellow-800 mb-2">How to fix this:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Go to your Supabase dashboard</li>
                    <li>2. Navigate to Authentication → Policies</li>
                    <li>3. Find the Purchase_Order_List table</li>
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
        ) : filteredPOs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <Package size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                {poList.length === 0 ? 'No purchase orders found in database' : 'No purchase orders match your search'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {poList.length === 0 
                  ? 'The Purchase_Order_List table appears to be empty. Please add some data to see it here.'
                  : 'Try adjusting your search terms to find purchase orders.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">PO ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mill Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Consignee Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Incoming Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Outgoing Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPOs.map((po) => (
                  <tr key={po.PO_ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{po.PO_ID}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-900">{po.Mill_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <span className="text-gray-900 break-words">
                          {po.Consignee_name ? po.Consignee_name.replace(/^Delivery:\s*-?\s*/i, '') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(po.Incoming_order_timestamp + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(po.Incoming_order_timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(po.Outgoing_order_timestamp + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(po.Outgoing_order_timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </div>
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
                        <button 
                          onClick={async () => {
                            // Check PDF availability in real-time before attempting download
                            const hasPDF = await checkPDFForPO(po.PO_ID);
                            if (hasPDF) {
                              handleDownloadPDF(po.PO_ID);
                            } else {
                              alert(`📄 PDF not yet generated for ${po.PO_ID}. The file is not found in the storage bucket. Please contact your administrator to generate the PDF.`);
                            }
                          }}
                          disabled={downloadingPOs.has(po.PO_ID)}
                          className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-purple-600`}
                          title="Download PDF"
                        >
                          {downloadingPOs.has(po.PO_ID) ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
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
    </div>
  );
}
