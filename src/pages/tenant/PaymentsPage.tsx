import { useState } from 'react';
import {
  useGetPaymentReceiptStatusQuery,
  useGetMyPaymentsQuery,
  useLogPaymentMutation,
} from '../../services/tenantApi';
import {
  CreditCard, Plus, RefreshCw, FileText, TrendingUp, CheckCircle,
  Clock, AlertTriangle, Loader2, Wallet, Calendar, Receipt, ArrowUpRight
} from 'lucide-react';

// Added Payment interface
interface Payment {
  id: string;
  amount: number;
  payment_for_month: number;
  payment_type: string;
  payment_for_year: number;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  reference_number?: string;
  receipt_file?: string;
  acknowledgement_status?: string;
  status?: string;
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'receipts' | 'log-payment'>('receipts');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: '',
    reference_number: '',
    payment_for_month: new Date().getMonth() + 1,
    payment_for_year: new Date().getFullYear(),
    due_date: '',
    notes: '',
    receipt_file: null as File | null,
    payment_type: '' // NEW: Added payment_type to form state
  });

  // API hooks
  const { data: paymentStatus, isLoading: statusLoading, refetch: refetchStatus } = useGetPaymentReceiptStatusQuery();
  const { data: allPayments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useGetMyPaymentsQuery();
  const [logPayment, { isLoading: logging }] = useLogPaymentMutation();

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(Number(amount));
  };

  const paymentMethods = [
    'Mobile Money',
    'Bank Transfer',
    'Cash',
    'Credit Card',
    'Debit Card',
    'Cheque'
  ];

  // NEW: Added payment types options
  const paymentTypes = [
    'Rent',
    'Security Deposit',
    'Maintenance',
    'Utilities',
    'Other'
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  // Added safe date formatter
  const formatDate = (value: string | undefined) => {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  // Status mapping from ID to name
    const statusMap: Record<number, string> = {
      1: 'Pending',
      2: 'Paid',
      3: 'Overdue',
      4: 'Partial',
      5: 'Cancelled',
      6: 'Refunded',
      7: 'Processing',
      8: 'Failed'
    };

  // Helper function to format status text consistently
  const formatStatusName = (status: string | undefined) => {
    console.log('Formatting status:', status);
    if (!status) return 'Unknown';
    
    const id = parseInt(status);
    if (isNaN(id)) return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    return statusMap[id] || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'partial':
        return 'bg-indigo-100 text-indigo-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'refunded':
        return 'bg-teal-100 text-teal-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('amount', paymentForm.amount);
    formData.append('payment_method', paymentForm.payment_method);
    formData.append('reference_number', paymentForm.reference_number);
    formData.append('payment_for_month', paymentForm.payment_for_month.toString());
    formData.append('payment_for_year', paymentForm.payment_for_year.toString());
    formData.append('due_date', paymentForm.due_date);
    formData.append('notes', paymentForm.notes);
    formData.append('payment_type', paymentForm.payment_type); // NEW: Added payment_type to FormData
    
    if (paymentForm.receipt_file) {
      formData.append('receipt_file', paymentForm.receipt_file);
    }

    try {
      const result = await logPayment(formData).unwrap();
      alert(result.message || 'Payment logged successfully!');
      setPaymentForm({
        amount: '',
        payment_method: '',
        reference_number: '',
        payment_for_month: new Date().getMonth() + 1,
        payment_for_year: new Date().getFullYear(),
        due_date: '',
        notes: '',
        receipt_file: null,
        payment_type: '' // NEW: Reset payment_type
      });
    } catch (error: any) {
      console.error('Error logging payment:', error);
      alert(error?.data?.error || 'Failed to log payment');
    }
  };

  const renderReceiptsTab = () => (
    <div className="space-y-8 pb-24 w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {/* Total Paid */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentStatus?.total_paid || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        {/* Pending */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentStatus?.total_pending || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        {/* This Month */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {allPayments.filter(p =>
                  p.payment_for_month === new Date().getMonth() + 1 &&
                  p.payment_for_year === new Date().getFullYear()
                ).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        {/* Overdue */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {allPayments.filter(p => formatStatusName(p.status)?.toLowerCase() === 'overdue').length}
                {/* UPDATED: Use formatStatusName to ensure consistent casing */}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="backdrop-blur-xl bg-white/70 rounded-xl border border-gray-200 shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Payment History
          </h3>
          <button
            type="button"
            onClick={() => { refetchStatus(); refetchPayments(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
        <div className="p-6">
          {statusLoading || paymentsLoading ? (
            <div className="text-center py-12 flex flex-col items-center gap-4 text-gray-600">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-lg">Loading payment history...</p>
            </div>
          ) : allPayments.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-4 text-gray-500">
              <CreditCard className="w-16 h-16 text-gray-400" />
              <p className="text-lg font-medium">No payment records found</p>
              <p className="text-sm">Your payment history will appear here</p>
              <button
                onClick={()=>setActiveTab('log-payment')}
                className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
              >
                Log First Payment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 py-3">Amount</th>
                    <th className="text-left font-medium text-gray-600 py-3">Type</th> {/* NEW: Added Payment Type column */}
                    <th className="text-left font-medium text-gray-600 py-3">Month/Year</th>
                    <th className="text-left font-medium text-gray-600 py-3">Due Date</th>
                    <th className="text-left font-medium text-gray-600 py-3">Paid Date</th>
                    <th className="text-left font-medium text-gray-600 py-3">Method</th>
                    <th className="text-left font-medium text-gray-600 py-3">Status</th>
                    <th className="text-left font-medium text-gray-600 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((payment: Payment) => {
                    const status = payment.acknowledgement_status || payment.status || 'Unknown';
                    const formattedStatus = formatStatusName(status); // UPDATED: Format status consistently
                    return (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-4 text-gray-600">
                          {payment.payment_type || 'N/A'} {/* NEW: Display payment type */}
                        </td>
                        <td className="py-4 text-gray-600">
                          {months.find(m => m.value === payment.payment_for_month)?.label} {payment.payment_for_year}
                        </td>
                        <td className="py-4 text-gray-600">
                          {formatDate(payment.due_date)}
                        </td>
                        <td className="py-4 text-gray-600">
                          {payment.paid_at ? formatDate(payment.paid_at) : '—'}
                        </td>
                        <td className="py-4 text-gray-600">
                          {payment.payment_method || 'N/A'}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(formattedStatus)}`}>
                            {formattedStatus} {/* UPDATED: Use formatted status */}
                          </span>
                        </td>
                        <td className="py-4">
                          {payment.receipt_file ? (
                            <a
                              href={payment.receipt_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogPaymentTab = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payment Instructions
        </h3>
        <ul className="text-xs md:text-sm text-blue-800 space-y-1">
          <li>• Fill in all payment details accurately</li>
          <li>• Attach your payment receipt or screenshot</li>
          <li>• Your payment will be verified by the property manager</li>
          <li>• You'll receive confirmation once verified</li>
        </ul>
      </div>

      {/* Payment Form */}
      <div className="backdrop-blur-xl bg-white/70 rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
            Log New Payment
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleLogPayment} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (UGX)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transaction ID or Check Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({...paymentForm, due_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment For Month</label>
                <select
                  value={paymentForm.payment_for_month}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_for_month: parseInt(e.target.value)})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={paymentForm.payment_for_year}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_for_year: parseInt(e.target.value)})}
                  required
                  min="2020"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <select
                  value={paymentForm.payment_type}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  {paymentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Attachment</label>
              <input
                type="file"
                onChange={(e) => setPaymentForm({...paymentForm, receipt_file: e.target.files?.[0] || null})}
                accept="image/*,application/pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Upload payment receipt, screenshot, or proof of payment</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional payment details or notes"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={logging}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium"
              >
                {logging ? 'Submitting...' : 'Submit Payment'}
              </button>
              <button
                type="button"
                onClick={() => setPaymentForm({
                  amount: '',
                  payment_method: '',
                  reference_number: '',
                  payment_for_month: new Date().getMonth() + 1,
                  payment_for_year: new Date().getFullYear(),
                  due_date: '',
                  notes: '',
                  receipt_file: null,
                  payment_type: '' // NEW: Reset payment_type
                })}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex-1 p-4 lg:p-6 xl:p-8 space-y-4 xl:space-y-6 mx-auto w-full max-w-none relative z-10">
      {/* Creative SVG Blobs */}
      {/* <div className="absolute top-10 left-20 w-48 h-48 opacity-20" style={{ transform: 'rotate(45deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10c20 0 30 20 30 40s-10 40-30 40S10 70 10 50 30 10 50 10z" fill="#3b82f6" />
        </svg>
      </div>
      <div className="absolute top-40 right-32 w-36 h-36 opacity-15" style={{ transform: 'rotate(-30deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 20c15-5 35 5 40 25s-5 35-25 40S15 75 10 55 15 25 30 20z" fill="#10b981" />
        </svg>
      </div>
      <div className="absolute bottom-20 left-1/4 w-56 h-56 opacity-10" style={{ transform: 'rotate(60deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30c10-10 30-10 40 0s10 30 0 40-30 10-40 0S10 40 20 30z" fill="#f59e0b" />
        </svg>
      </div>
      <div className="absolute top-1/3 right-10 w-40 h-40 opacity-25" style={{ transform: 'rotate(120deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 10c15 5 25 25 20 40s-25 25-40 20S5 55 10 40 25 5 40 10z" fill="#ef4444" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-1/3 w-52 h-52 opacity-20" style={{ transform: 'rotate(-45deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5c20 10 25 35 15 50s-35 25-50 15S-5 55 5 40 30-5 50 5z" fill="#8b5cf6" />
        </svg>
      </div> */}
      <div className="space-y-4 xl:space-y-6 pb-24 w-full">
        {/* Enhanced Header */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-14 -left-14 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-16 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-indigo-500/10 to-purple-600/10 rounded-full blur-3xl" />
          <div className="relative flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                  Payments Overview
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Your payment history and management
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab !== 'log-payment' && (
                <button
                  onClick={()=>setActiveTab('log-payment')}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Log Payment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-xl bg-white/70 rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-6 ">
              <button
                onClick={() => setActiveTab('receipts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm m-4 ${
                  activeTab === 'receipts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 inline-block mr-1" />
                History
              </button>
              <button
                onClick={() => setActiveTab('log-payment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm m-4 ${
                  activeTab === 'log-payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="w-5 h-5 inline-block mr-1" />
                Log Payment
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'receipts' ? renderReceiptsTab() : renderLogPaymentTab()}
          </div>
        </div>

        {/* Mobile FAB */}
        {activeTab === 'receipts' && (
          <button
            onClick={()=>setActiveTab('log-payment')}
            className="fixed bottom-5 right-5 p-4 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center"
            aria-label="Log Payment"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </main>
  );
}