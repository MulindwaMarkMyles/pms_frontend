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
    receipt_file: null as File | null
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

  const getStatusColor = (status: string) => {
    // FIX: call toLowerCase()
    switch (status?.toString().toLowerCase()) {
      case 'paid':
      case 'acknowledged':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
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
        receipt_file: null
      });
    } catch (error: any) {
      console.error('Error logging payment:', error);
      alert(error?.data?.error || 'Failed to log payment');
    }
  };

  const renderReceiptsTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {/* Total Paid */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {formatCurrency(paymentStatus?.total_paid || 0)}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
        {/* Pending */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-600">
                {paymentStatus?.total_pending || 0}
              </p>
            </div>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        {/* This Month */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">This Month</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                {allPayments.filter(p =>
                  p.payment_for_month === new Date().getMonth() + 1 &&
                  p.payment_for_year === new Date().getFullYear()
                ).length}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Payment History
          </h3>
          <button
            type="button"
            onClick={() => { refetchStatus(); refetchPayments(); }}
            className="inline-flex items-center gap-1 text-xs md:text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="p-4 md:p-6">
          {statusLoading || paymentsLoading ? (
            <div className="text-center py-10 flex flex-col items-center gap-3 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Loading payment history...</p>
            </div>
          ) : allPayments.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center gap-3 text-gray-500">
              <CreditCard className="w-10 h-10 text-gray-400" />
              <p className="text-sm font-medium">No payment records found</p>
              <p className="text-xs">Your payment history will appear here</p>
              <button
                onClick={()=>setActiveTab('log-payment')}
                className="mt-2 text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Log First Payment
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              { window.innerWidth < 640 ? (
              <div className="sm:hidden space-y-4">
                {allPayments.map((payment: Payment) => {
                  const status = payment.acknowledgement_status || payment.status || 'Unknown';
                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-base font-semibold">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {months.find(m => m.value === payment.payment_for_month)?.label}{' '}
                            {payment.payment_for_year}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="space-y-1">
                          <p className="flex justify-between">
                            <span className="text-gray-500">Due</span>
                            <span className="font-medium">{formatDate(payment.due_date)}</span>
                          </p>
                          {payment.paid_at && (
                            <p className="flex justify-between">
                              <span className="text-gray-500">Paid</span>
                              <span className="text-emerald-600 font-medium">{formatDate(payment.paid_at)}</span>
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="flex justify-between">
                            <span className="text-gray-500">Method</span>
                            <span className="font-medium truncate max-w-[90px]">
                              {payment.payment_method || 'N/A'}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Ref</span>
                            <span className="font-medium truncate max-w-[90px]">
                              {payment.reference_number || '—'}
                            </span>
                          </p>
                        </div>
                      </div>
                      {payment.receipt_file && (
                        <a
                          href={payment.receipt_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Receipt
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>) : null}

              {/* Desktop / Tablet List */}
              {window.innerWidth > 640 ? (
              <div className="sm:block space-y-4">
                {allPayments.map((payment: Payment) => {
                  const status = payment.acknowledgement_status || payment.status || 'Unknown';
                  return (
                    <div key={payment.id} className="payment-card bg-gray-50 border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold">{formatCurrency(payment.amount)}</h4>
                          <p className="text-sm text-gray-600">
                            {months.find(m => m.value === payment.payment_for_month)?.label}{' '}
                            {payment.payment_for_year}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Due Date:</span>
                            <span className="text-sm font-medium">{formatDate(payment.due_date)}</span>
                          </div>
                          {payment.paid_at && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Paid Date:</span>
                              <span className="text-sm font-medium">{formatDate(payment.paid_at)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Payment Method:</span>
                            <span className="text-sm font-medium">
                              {payment.payment_method || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reference:</span>
                            <span className="text-sm font-medium break-all">
                              {payment.reference_number || 'N/A'}
                            </span>
                          </div>
                          {payment.receipt_file && (
                            <div className="mt-3">
                              <a
                                href={payment.receipt_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <FileText className="w-4 h-4 inline-block" />
                                <span>View Receipt</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogPaymentTab = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 md:p-6">
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
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
            Log New Payment
          </h3>
        </div>
        <div className="p-4 md:p-6">
          <form onSubmit={handleLogPayment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  receipt_file: null
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
    <div className="space-y-6 sm:space-y-8 max-w-[1200px] mx-auto pb-24" style={{ marginTop: '80px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-4 sm:gap-5">
            {/* <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl">
              <Home className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div> */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                Payments Overview
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate max-w-[240px] sm:max-w-none">
                Your payment history and management
              </p>
            </div>
          </div>
        <div className="flex gap-2">
          {activeTab !== 'log-payment' && (
            <button
              onClick={()=>setActiveTab('log-payment')}
              className="hidden sm:inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Log Payment
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-6 px-4 md:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('receipts')}
              className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
                activeTab === 'receipts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1" />
              History
            </button>
            <button
              onClick={() => setActiveTab('log-payment')}
              className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
                activeTab === 'log-payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1" />
              Log Payment
            </button>
          </nav>
        </div>
        <div className="p-4 md:p-6">
          {activeTab === 'receipts' ? renderReceiptsTab() : renderLogPaymentTab()}
        </div>
      </div>

      {/* Mobile FAB */}
      {activeTab === 'receipts' && (
        <button
          onClick={()=>setActiveTab('log-payment')}
            className="sm:hidden fixed bottom-5 right-5 p-4 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center"
            aria-label="Log Payment"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}