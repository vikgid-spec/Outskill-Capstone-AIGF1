import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Temporary component to check demo_requests table structure
export default function CheckDemoRequestsSchema() {
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSchema = async () => {
      try {
        // Try to get one row to see the structure
        const { data, error } = await supabase
          .from('demo_requests')
          .select('*')
          .limit(1);

        if (error) {
          setError(error.message);
          return;
        }

        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]));
        } else {
          // If no rows, try to get schema info by attempting a select with all known possible columns
          // This is a workaround - we'll list common columns
          setColumns(['full_name', 'work_email', 'company_name', 'phone_number', 'job_title', 'company_size', 'message', 'created_at', 'id']);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    checkSchema();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Demo Requests Table Columns:</h2>
      {error && <p className="text-red-500">Error: {error}</p>}
      {columns.length > 0 && (
        <ul className="list-disc list-inside">
          {columns.map((col) => (
            <li key={col} className="font-mono">{col}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

