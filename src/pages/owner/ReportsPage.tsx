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

  const renderPaymentReport = () => (
    <div className="space-y-8  mx-auto pb-24 w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
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
        <div className="p-6">
          {/* Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
          {(!occupancyReport?.occupancy_trends || occupancyReport.occupancy_trends.length === 0) ? (
        <div className="text-center py-8 text-gray-500">No occupancy data available</div>
          ) : (
        (() => {
          const trends = occupancyReport.occupancy_trends as any[];
          const points = trends.slice(-24); // use last up to 24 points for sparkline
          const rates = points.map(p => Number(p.occupancy_rate ?? 0));
          const max = Math.max(...rates, 1);
          const min = Math.min(...rates, 0);
          const avg = (rates.reduce((s, v) => s + v, 0) / rates.length) || 0;
          const first = rates[0] ?? 0;
          const last = rates[rates.length - 1] ?? 0;
          const change = Math.round(last - first);
          const sparkWidth = 280;
          const sparkHeight = 60;
          const toSvgPoints = (vals: number[]) => {
            if (vals.length === 0) return '';
            return vals.map((v, i) => {
          const x = (i / (vals.length - 1 || 1)) * sparkWidth;
          // normalize to [0,1], invert y for SVG coords
          const norm = max === min ? 0.5 : (v - min) / (max - min);
          const y = (1 - norm) * (sparkHeight - 4) + 2;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
          };

          const svgPoints = toSvgPoints(rates);

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Overview + sparkline */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
            <p className="text-sm text-gray-600">Period average</p>
            <p className="text-2xl font-bold text-blue-600">{Math.round(avg)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Peak: <span className="font-medium text-green-600">{Math.round(max)}%</span>{' '}
              • Low: <span className="font-medium text-red-600">{Math.round(min)}%</span>
            </p>
              </div>
              <div className="text-right">
            <p className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)} pts
            </p>
            <p className="text-xs text-gray-500">change over period</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
            <svg width="100%" viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="w-full h-16">
              <defs>
                <linearGradient id="gradFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>
              {svgPoints && (
                <>
              <polyline
                points={svgPoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* area under line */}
              <path
                d={
                  'M ' +
                  svgPoints +
                  ` L ${sparkWidth},${sparkHeight} L 0,${sparkHeight} Z`
                }
                fill="url(#gradFill)"
                stroke="none"
                opacity={0.6}
              />
                </>
              )}
            </svg>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{new Date(points[0].date).toLocaleDateString()}</span>
              <span>{new Date(points[points.length - 1].date).toLocaleDateString()}</span>
            </div>
              </div>

              <div className="w-40 hidden md:block">
            <div className="text-sm text-gray-600">Latest</div>
            <div className="text-xl font-bold text-blue-600">{last}%</div>
            <div className="text-xs text-gray-500">{points[points.length - 1].occupied} of {points[points.length - 1].total_apartments} occupied</div>
              </div>
            </div>
          </div>

          {/* Right: Recent breakdown list (uses space efficiently) */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 overflow-y-auto max-h-64">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent snapshots</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trends.slice(-8).reverse().map((trend: any, idx: number) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{new Date(trend.date).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">{trend.occupied}/{trend.total_apartments}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-blue-600">{trend.occupancy_rate}%</div>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${trend.occupancy_rate}%` }}
              />
                </div>
              </div>
            </div>
              ))}
            </div>
          </div>
            </div>
          );
        })()
          )}
        </div>
      </div>

      {/* Estate Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Estate Occupancy Breakdown</h3>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 gap-6">
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
      <div className="grid grid-cols-4 gap-6">
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
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
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
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
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
        <div className="p-6">
          {/* Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
          </div>
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
      <div className="space-y-4 xl:space-y-6">
        {/* Enhanced Header */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-14 -right-14 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  Comprehensive property management reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex gap-6 items-end">
            {/* Report Type Selection */}
            <div className="w-auto">
              <label className="block text-xs font-medium text-gray-700 mb-2">Report Type</label>
              <div className="flex gap-2">
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
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="flex items-center justify-center text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Export Button */}
            <div className="ml-auto">
              <button className="px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-700 text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div>
          {isLoading() ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12">
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
    </main>
  );
}