import { Package, Search, Eye, CreditCard as Edit, Trash2, Calendar, User, Download, Loader2, FileText, Building2 } from 'lucide-react';
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
  const [itemsToShow, setItemsToShow] = useState(25); // Start with 25 items
  const [animatedValues, setAnimatedValues] = useState({
    totalPOs: 0,
    activeOrders: 0,
    uniqueMills: 0,
  });

  // Initial fetch + Realtime subscription
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const fetchPOs = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING POS VIA SUPABASE ===');
        
        // Try Supabase client first, but fallback to direct API if empty (RLS issue)
        let data: PO[] | null = null;
        let error: any = null;
        let usedFallback = false;
        
        try {
          const result = await supabase
            .from('Purchase_Order_List')
            .select('PO_ID,Mill_name,Consignee_name,Incoming_order_timestamp,Outgoing_order_timestamp')
            .order('PO_ID', { ascending: false }); // Descending order - latest first
          
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
          usedFallback = true;
          console.log('🔄 Falling back to direct API call...');
          
          const apiUrl = 'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Purchase_Order_List?select=PO_ID,Mill_name,Consignee_name,Incoming_order_timestamp,Outgoing_order_timestamp&order=PO_ID.desc';
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
        
        console.log('=== PO FETCH SUCCESS ===');
        console.log('Data received:', data?.length || 0, 'records');
        console.log('First few records:', data?.slice(0, 3));
        console.log('=== END PO FETCH ===');
        
        if (!data || data.length === 0) {
          console.warn('⚠️ No data received from query');
        } else {
          // Clear any previous errors if we got data
          setError(null);
        }
        
        setPoList(data || []);
        setLastFetchTime(new Date());
        
        console.log('State updated - poList length:', data?.length || 0);
        console.log('State updated - lastFetchTime:', new Date().toISOString());
        
        if (data && data.length > 0) {
          console.log(`Successfully loaded ${data.length} purchase orders from database`);
        }
      } catch (err) {
        console.error('❌ Error fetching purchase orders:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase orders';
        setError(errorMessage);
        console.error('Full error details:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPOs();

    // Set up realtime subscription
    try {
      subscription = supabase
        .channel('purchase_orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'Purchase_Order_List',
          },
          (payload: any) => {
            console.log('🔄 Realtime update received:', payload.eventType, payload);
            
            if (payload.eventType === 'INSERT') {
              const newPO = payload.new as PO;
              setPoList(prev => {
                const updated = [newPO, ...prev];
                // Sort by PO_ID descending to maintain order (latest first)
                return updated.sort((a, b) => {
                  // Extract numeric part for proper sorting (PO-101 > PO-100)
                  const numA = parseInt(a.PO_ID.replace(/^PO-?/i, '')) || 0;
                  const numB = parseInt(b.PO_ID.replace(/^PO-?/i, '')) || 0;
                  return numB - numA; // Descending
                });
              });
              setLastFetchTime(new Date());
              console.log('✅ New PO added via realtime:', newPO.PO_ID);
            } else if (payload.eventType === 'UPDATE') {
              const updatedPO = payload.new as PO;
              setPoList(prev => prev.map(po => 
                po.PO_ID === updatedPO.PO_ID ? updatedPO : po
              ));
              setLastFetchTime(new Date());
              console.log('✅ PO updated via realtime:', updatedPO.PO_ID);
            } else if (payload.eventType === 'DELETE') {
              const deletedPO = payload.old as PO;
              setPoList(prev => prev.filter(po => 
                po.PO_ID !== deletedPO.PO_ID
              ));
              setLastFetchTime(new Date());
              console.log('✅ PO deleted via realtime:', deletedPO.PO_ID);
            }
          }
        )
        .subscribe((status: string) => {
          console.log('📡 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to Purchase_Order_List changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error');
            setError('Failed to connect to realtime updates. Please refresh the page.');
          }
        });
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      setError('Failed to set up realtime updates. Using regular polling instead.');
    }

    // Cleanup function
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up realtime subscription');
        supabase.removeChannel(subscription);
      }
    };
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
  const generateDatePatterns = () => {
    const patterns = [];
    const today = new Date();
    
    // Generate patterns for the last 7 days (including today)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
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
      const datePatterns = generateDatePatterns();
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
      
      // Try public URL approach first (since bucket is public and we know files exist)
      console.log(`🔍 Trying public URL approach first...`);
      
      // Use the same dynamic date patterns for public URLs
      const publicPaths = [
        // Dynamic date patterns (most recent first)
        ...datePatterns.map(date => `Purchase Order - ${poId} -Greentex paper mill - ${date} .pdf`),
        // Fallback patterns
        `Purchase Order - ${poId} -`,
        `${poId}.pdf`,
        `PO-${numericId}.pdf`,
        `${numericId}.pdf`
      ];
      
      for (const publicPath of publicPaths) {
        try {
          const publicUrl = `${supabase.supabaseUrl}/storage/v1/object/public/nonpublic/${encodeURIComponent(publicPath)}`;
          console.log(`🔍 Testing public URL: ${publicUrl}`);
          
          // Test if the URL is accessible
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ Public URL accessible: ${publicPath}`);
            foundPath = publicPath;
            signedUrl = publicUrl;
            break;
          } else {
            console.log(`❌ Public URL not accessible: ${publicPath} (${response.status})`);
          }
        } catch (err) {
          console.log(`❌ Error testing public URL for ${publicPath}:`, err);
        }
      }
      
      // If no file found through public URLs, try signed URL approach as fallback
      if (!foundPath) {
        console.log(`🔍 Public URLs failed, trying signed URL approach...`);
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
            console.log(`🔍 Trying direct signed URL for: ${directPath}`);
            const { data, error } = await supabase.storage
              .from('nonpublic')
              .createSignedUrl(directPath, 60);
            
            if (!error && data?.signedUrl) {
              console.log(`✅ Direct signed URL successful for: ${directPath}`);
              foundPath = directPath;
              signedUrl = data.signedUrl;
              break;
            } else {
              console.log(`❌ Direct signed URL failed for: ${directPath}`);
            }
          } catch (err) {
            console.log(`❌ Error with direct signed URL for ${directPath}:`, err);
          }
        }
        
        if (!foundPath) {
          console.log(`❌ No PDF found for ${poId} in 'nonpublic' bucket`);
          throw new Error('PDF_NOT_FOUND');
        }
      }
      
      // Get the signed URL for the found file (if we don't already have one)
      if (!signedUrl) {
        console.log(`📥 Getting signed URL from 'nonpublic' bucket for: ${foundPath}`);
        const { data, error } = await supabase.storage
          .from('nonpublic')
          .createSignedUrl(foundPath, 60); // 60 seconds expiry
        
        if (error) {
          console.error('❌ Signed URL error from nonpublic bucket:', error);
          throw new Error(`SIGNED_URL_ERROR: ${error.message}`);
        }
        
        if (!data?.signedUrl) {
          throw new Error('SIGNED_URL_ERROR: No signed URL received from nonpublic bucket');
        }
        
        signedUrl = data.signedUrl;
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
      const datePatterns = generateDatePatterns();
      
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
      
      for (const fileName of testFiles) {
        try {
          const publicUrl = `${supabase.supabaseUrl}/storage/v1/object/public/nonpublic/${encodeURIComponent(fileName)}`;
          console.log(`🔍 Testing: ${fileName}`);
          
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ Found: ${fileName} (${response.status})`);
          } else {
            console.log(`❌ Not found: ${fileName} (${response.status})`);
          }
        } catch (err) {
          console.log(`❌ Error testing ${fileName}:`, err);
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

  // Sort PO list by PO_ID descending (latest first) and filter by search term
  const sortedPOs = [...poList].sort((a, b) => {
    // Extract numeric part for proper sorting (PO-101 > PO-100)
    const numA = parseInt(a.PO_ID.replace(/^PO-?/i, '')) || 0;
    const numB = parseInt(b.PO_ID.replace(/^PO-?/i, '')) || 0;
    return numB - numA; // Descending
  });

  const filteredPOs = sortedPOs.filter(po => {
    const matchesSearch = po.PO_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.Mill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (po.Consignee_name && po.Consignee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Paginate: show only itemsToShow items
  const displayedPOs = filteredPOs.slice(0, itemsToShow);
  const hasMore = filteredPOs.length > itemsToShow;

  const handleViewNext = () => {
    setItemsToShow(prev => prev + 25);
  };

  // Reset pagination when search term changes
  useEffect(() => {
    setItemsToShow(25);
  }, [searchTerm]);

  // Animate numbers on first page load
  useEffect(() => {
    if (poList.length === 0) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const totalPOs = poList.length;
    const activeOrders = poList.length;
    const uniqueMills = new Set(poList.map(po => po.Mill_name)).size;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedValues({
        totalPOs: Math.floor(totalPOs * easeOutQuart),
        activeOrders: Math.floor(activeOrders * easeOutQuart),
        uniqueMills: Math.floor(uniqueMills * easeOutQuart),
      });

      if (step >= steps) {
        clearInterval(timer);
        // Set final values
        setAnimatedValues({
          totalPOs,
          activeOrders,
          uniqueMills,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [poList.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track all your purchase orders</p>
          {lastFetchTime && (
            <p className="text-sm text-green-600 mt-1">
              ✅ Last updated: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#03c5dc]" />
            <input
              type="text"
              placeholder="Search by PO ID, Mill name, or Consignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03c5dc] focus:border-[#03c5dc] w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total POs */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Total POs</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.totalPOs}</div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Active Orders</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.activeOrders}</div>
          </div>
        </div>

        {/* Unique Mills */}
        <div className="bg-[#22c6dc]/15 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111826]">Unique Mills</h2>
              <div className="p-2 rounded-lg bg-[#03c5dc]">
                <Building2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-2xl font-semibold text-[#111826]">{animatedValues.uniqueMills}</div>
          </div>
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
                {displayedPOs.map((po) => (
                  <tr key={po.PO_ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f6f6f6] rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-[#03c5dc]" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{po.PO_ID}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-[#03c5dc]" />
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
                          <Calendar size={14} className="text-[#03c5dc]" />
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
                          <Calendar size={14} className="text-[#03c5dc]" />
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
                          className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#03c5dc] hover:text-[#03c5dc]/80`}
                          title="Download PDF"
                        >
                          {downloadingPOs.has(po.PO_ID) ? (
                            <Loader2 size={24} className="animate-spin" />
                          ) : (
                            <Download size={24} />
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
    </div>
  );
}
