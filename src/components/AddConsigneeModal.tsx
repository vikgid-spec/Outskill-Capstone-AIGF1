import { useState } from 'react';
import { X, Save, User, MapPin, Hash } from 'lucide-react';

interface AddConsigneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddConsigneeModal({ isOpen, onClose, onSuccess }: AddConsigneeModalProps) {
  const [formData, setFormData] = useState({
    consignee_name: '',
    consignee_address: '',
    consignee_gstin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtaG11ZWdkb3Vjem5sdW5lZnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjMxNTYsImV4cCI6MjA3NTQ5OTE1Nn0.dBcCg_esHz5UbHyAaccYUUlZevcykXzL6Cnb-2PltZ8';

      // First, get the highest existing Consignee_id
      const getHighestIdResponse = await fetch(
        'https://smhmuegdoucznluneftm.supabase.co/rest/v1/Hawa_Consignee?select=Consignee_id&order=Consignee_id.desc&limit=1',
        {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!getHighestIdResponse.ok) {
        throw new Error(`Failed to fetch highest ID: ${getHighestIdResponse.status}`);
      }

      const existingRecords = await getHighestIdResponse.json();
      let nextId = 'C001'; // Default if no records exist

      if (existingRecords && existingRecords.length > 0) {
        const highestId = existingRecords[0].Consignee_id;
        // Extract the number part and increment by 1
        const numberPart = parseInt(highestId.replace('C', ''));
        nextId = `C${(numberPart + 1).toString().padStart(3, '0')}`;
      }

      // Now insert the new consignee with the calculated ID
      const response = await fetch('https://smhmuegdoucznluneftm.supabase.co/rest/v1/Hawa_Consignee', {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          Consignee_id: nextId,
          Consignee_name: formData.consignee_name,
          Consignee_address: formData.consignee_address,
          Consignee_GSTIN: formData.consignee_gstin
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add consignee: ${response.status} - ${errorData}`);
      }

      // Reset form and close modal
      setFormData({ consignee_name: '', consignee_address: '', consignee_gstin: '' });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding consignee:', err);
      setError(err instanceof Error ? err.message : 'Failed to add consignee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Consignee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Consignee Name *
            </label>
            <input
              type="text"
              name="consignee_name"
              value={formData.consignee_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter consignee name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Address *
            </label>
            <textarea
              name="consignee_address"
              value={formData.consignee_address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash size={16} className="inline mr-2" />
              GSTIN
            </label>
            <input
              type="text"
              name="consignee_gstin"
              value={formData.consignee_gstin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter GSTIN (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Add Consignee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
