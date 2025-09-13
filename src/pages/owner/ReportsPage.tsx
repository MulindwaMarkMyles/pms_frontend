import { useState } from 'react';
import {
  useGetPaymentReportQuery,
  useGetOccupancyReportQuery,
  useGetComplaintReportQuery,
  useGetComplaintTrendsQuery,
  useGetTenantsExpiringQuery
} from '../../services/ownerApi';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Home,
  Building,
  MessageSquare,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  Download,
  Loader2,
  FileText,
  Users,
  Target
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'payments' | 'occupancy' | 'complaints' | 'tenancy'>('payments');
  const [dateRange, setDateRange] = useState({
    start_date: '2025-01-01',
    end_date: '2025-12-31'
  });

  // API hooks for reports
  const { data: paymentReport, isLoading: paymentLoading } = useGetPaymentReportQuery(dateRange, {
    skip: reportType !== 'payments'
  });
  const { data: occupancyReport, isLoading: occupancyLoading } = useGetOccupancyReportQuery(dateRange, {
    skip: reportType !== 'occupancy'
  });
  const { data: complaintReport, isLoading: complaintLoading } = useGetComplaintReportQuery(dateRange, {
    skip: reportType !== 'complaints'
  });
  const { data: complaintTrends } = useGetComplaintTrendsQuery({ days: 30 });
  const { data: expiringTenants = [] } = useGetTenantsExpiringQuery(dateRange, {
    skip: reportType !== 'tenancy'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  const reportTypes = [
    { id: 'payments', label: 'Payment Report', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'occupancy', label: 'Occupancy Report', icon: <Building className="w-5 h-5" /> },
    { id: 'complaints', label: 'Complaint Report', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'tenancy', label: 'Tenancy Report', icon: <Calendar className="w-5 h-5" /> },
  ];

  const isLoading = () => {
    switch (reportType) {
      case 'payments': return paymentLoading;
      case 'occupancy': return occupancyLoading;
      case 'complaints': return complaintLoading;
      default: return false;
    }
  };

  const mobilescreenwidth = window.innerWidth;

  const renderPaymentReport = () => (
    <div className="space-y-6 sm:space-y-8 max-w-[1200px] sm:max-w-[90%] mx-auto pb-24 w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentReport?.total_payments || 0}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(paymentReport?.total_amount || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentReport?.paid_amount || 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency((paymentReport?.pending_amount || 0) + (paymentReport?.overdue_amount || 0))}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Estate Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Estate Payment Performance</h3>
        </div>
        <div className="p-4 md:p-6">
          {/* Desktop Table */}
          { window.innerWidth >= 768 ? (
          <div className=" md:block">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className=" w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Estate</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Payments</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Total Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Paid Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentReport?.estates?.map((estate: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{estate.estate_name}</td>
                      <td className="py-3">{estate.payments}</td>
                      <td className="py-3">{formatCurrency(estate.total_amount)}</td>
                      <td className="py-3 text-green-600">{formatCurrency(estate.paid_amount)}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${estate.collection_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{estate.collection_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>) : null}

          {/* Mobile Card List */}
          {window.innerWidth < 768 ? (
          <div className="space-y-3">
            {(!paymentReport?.estates || paymentReport?.estates?.length === 0) && (
              <div className="text-center py-6 text-gray-500 text-sm">No estate data available</div>
            )}
            {paymentReport?.estates?.map((estate: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{estate.estate_name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {estate.collection_rate}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Payments</span>
                    <span className="font-medium">{estate.payments}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium">{formatCurrency(estate.total_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Paid</span>
                    <span className="font-medium text-green-600">{formatCurrency(estate.paid_amount)}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${estate.collection_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>) : null}
        </div>
      </div>
    </div>
  );

  const renderOccupancyReport = () => (
    <div className="space-y-6">
      {/* Occupancy Trends */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Occupancy Trends</h3>
        </div>
        <div className="p-4 md:p-6">
          {occupancyReport?.occupancy_trends?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No occupancy data available</div>
          ) : (
            <div className="space-y-4">
              {occupancyReport?.occupancy_trends?.slice(0, 10).map((trend: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(trend.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">
                      {trend.occupied} of {trend.total_apartments} occupied
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{trend.occupancy_rate}%</p>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${trend.occupancy_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estate Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Estate Occupancy Breakdown</h3>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {occupancyReport?.estate_breakdown?.map((estate: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">{estate.estate_name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Occupancy</span>
                    <span className="font-medium">{estate.avg_occupancy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Peak Occupancy</span>
                    <span className="font-medium text-green-600">{estate.peak_occupancy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lowest Occupancy</span>
                    <span className="font-medium text-red-600">{estate.lowest_occupancy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplaintReport = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-2xl font-bold text-gray-900">{complaintReport?.total_complaints || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{complaintReport?.resolved_complaints || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-blue-600">{complaintReport?.avg_resolution_time || 0} days</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(((complaintReport?.resolved_complaints || 0) / (complaintReport?.total_complaints || 1)) * 100)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Complaint Categories */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Complaint Categories</h3>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {complaintReport?.complaint_categories?.map((category: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{category.category}</h4>
                  <span className="text-sm text-gray-600">{category.count} complaints</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${category.resolution_rate}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{category.resolution_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trends */}
      {complaintTrends && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">Recent Trends (Last 30 Days)</h3>
          </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{complaintTrends.new_complaints}</p>
                  <p className="text-sm text-gray-600">New Complaints</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{complaintTrends.resolved_complaints}</p>
                  <p className="text-sm text-gray-600">Resolved Complaints</p>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );

  const renderTenancyReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Expiring Tenancies</h3>
        </div>
        <div className="p-4 md:p-6">
          {/* Desktop Table */}
          {mobilescreenwidth > 768 ? (
          <div className="md:block overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Tenant</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Apartment</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Estate</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Lease End</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringTenants.map((tenant: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{tenant.tenant_name}</td>
                    <td className="py-3">{tenant.apartment}</td>
                    <td className="py-3">{tenant.estate}</td>
                    <td className="py-3">{new Date(tenant.lease_end).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        tenant.days_until_expiry <= 0 
                          ? 'bg-red-100 text-red-700' 
                          : tenant.days_until_expiry <= 30
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {tenant.days_until_expiry <= 0 
                          ? `Expired ${Math.abs(tenant.days_until_expiry)} days ago`
                          : `${tenant.days_until_expiry} days remaining`
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>) : null}

          {/* Mobile Card List */}
          { mobilescreenwidth <= 768 ? (
          <div className="md:hidden space-y-3">
            {expiringTenants.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">No expiring tenancies in range</div>
            )}
            {expiringTenants.map((tenant: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900">{tenant.tenant_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                      tenant.days_until_expiry <= 0 
                        ? 'bg-red-100 text-red-700' 
                        : tenant.days_until_expiry <= 30
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                    {tenant.days_until_expiry <= 0 
                      ? `Expired ${Math.abs(tenant.days_until_expiry)}d`
                      : `${tenant.days_until_expiry}d left`}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{tenant.apartment} • {tenant.estate}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Lease End</span>
                  <span className="font-medium">{new Date(tenant.lease_end).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1 text-sm">Comprehensive property management reports</p>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-6 md:items-end">
          {/* Report Type Selection */}
          <div className="w-full md:w-auto">
            <label className="block text-xs font-medium text-gray-700 mb-2">Report Type</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {reportTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                    reportType === type.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-700">Date Range</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              />
              <span className="flex items-center justify-center text-gray-500 text-xs sm:text-sm">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="md:ml-auto">
            <button className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm flex items-center gap-2 justify-center">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {isLoading() ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 md:p-12">
            <div className="text-center">
              <div className="text-2xl mb-2 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <p className="text-gray-600">Loading report data...</p>
            </div>
          </div>
        ) : (
          <div className="px-1">
            {reportType === 'payments' && renderPaymentReport()}
            {reportType === 'occupancy' && renderOccupancyReport()}
            {reportType === 'complaints' && renderComplaintReport()}
            {reportType === 'tenancy' && renderTenancyReport()}
          </div>
        )}
      </div>
    </div>
  );
}