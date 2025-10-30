import React from 'react';
import { X, MessageSquare, Calendar, Phone, User, Building2 } from 'lucide-react';

interface CallSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtor: {
    Consignee_name: string;
    Consignee_Contact_name: string;
    phone_number: string;
    call_summary: string | null;
    follow_up_date: string | null;
    payment_status: string | null;
    call_count: number | null;
  } | null;
}

const CallSummaryModal: React.FC<CallSummaryModalProps> = ({ isOpen, onClose, debtor }) => {
  if (!isOpen || !debtor || !debtor.call_summary) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status.toLowerCase().includes('paid')) return 'bg-green-100 text-green-800';
    if (status.toLowerCase().includes('will pay') || status.toLowerCase().includes('promise')) return 'bg-yellow-100 text-yellow-800';
    if (status.toLowerCase().includes('overdue') || status.toLowerCase().includes('refuse')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Call Summary</h2>
              <p className="text-sm text-gray-600">Last call details and follow-up information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company & Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{debtor.Consignee_name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <User size={12} />
                  {debtor.Consignee_Contact_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} />
              {debtor.phone_number}
            </div>
          </div>

          {/* Call Summary */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              Call Summary
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {debtor.call_summary}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-gray-600" />
                Follow-up Date
              </h4>
              <p className="text-sm text-gray-600">{formatDate(debtor.follow_up_date)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Status</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(debtor.payment_status)}`}>
                {debtor.payment_status || 'No status'}
              </span>
            </div>
          </div>

          {/* Call Count */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Call History</h4>
            <p className="text-sm text-gray-600">
              Total calls made: <span className="font-medium">{debtor.call_count || 0}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallSummaryModal;

