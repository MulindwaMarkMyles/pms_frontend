import { apiSlice } from '../store';

export const ownerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard Analytics - UPDATED endpoints
    getOccupancyStatus: builder.query<any, { estate_id?: number; block_id?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.estate_id) searchParams.append('estate_id', params.estate_id.toString());
        if (params.block_id) searchParams.append('block_id', params.block_id.toString());
        return `/api/core/owner/occupancy-status/?${searchParams.toString()}`;
      },
      providesTags: ['Property'],
    }),

    getPaymentDashboardSummary: builder.query<any, void>({
      query: () => '/api/core/owner/payment-dashboard-summary/',
      providesTags: ['Payment'],
    }),

    getEstatePaymentStatus: builder.query<any[], void>({
      query: () => '/api/core/owner/estate-payment-status/',
      providesTags: ['Payment'],
    }),

    getComplaintAnalytics: builder.query<any, void>({
      query: () => '/api/core/owner/complaint-analytics/',
      providesTags: ['Complaint'],
    }),

    getComplaintTrends: builder.query<any, { days?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.days) searchParams.append('days', params.days.toString());
        return `/api/core/owner/complaint-trends/?${searchParams.toString()}`;
      },
      providesTags: ['Complaint'],
    }),

    getTenancyExpiryDashboard: builder.query<any, void>({
      query: () => '/api/core/owner/tenancy-expiry-dashboard/',
      providesTags: ['Tenant'],
    }),

    getTenantsExpiring: builder.query<any[], { start_date: string; end_date: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams(params);
        return `/api/core/owner/tenants-expiring/?${searchParams.toString()}`;
      },
      providesTags: ['Tenant'],
    }),

    // Payment Alerts & Reports - UPDATED endpoints
    getPaymentAlerts: builder.query<any, void>({
      query: () => '/api/core/owner/payment-alerts/',
      providesTags: ['Payment'],
    }),

    getPaymentReport: builder.query<any, { start_date: string; end_date: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams(params);
        return `/api/core/owner/payment-report/?${searchParams.toString()}`;
      },
      providesTags: ['Payment'],
    }),

    getOccupancyReport: builder.query<any, { start_date: string; end_date: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams(params);
        return `/api/core/owner/occupancy-report/?${searchParams.toString()}`;
      },
      providesTags: ['Property'],
    }),

    getComplaintReport: builder.query<any, { start_date: string; end_date: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams(params);
        return `/api/core/owner/complaint-report/?${searchParams.toString()}`;
      },
      providesTags: ['Complaint'],
    }),

    // ADDED: Export report endpoint
    exportReport: builder.mutation<any, { 
      report_type: 'payments' | 'occupancy' | 'complaints' | 'tenancy';
      format: 'excel' | 'pdf' | 'csv';
      start_date: string;
      end_date: string;
      filters?: Record<string, any>;
    }>({
      query: (body) => ({
        url: '/api/core/owner/export-report/',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetOccupancyStatusQuery,
  useGetPaymentDashboardSummaryQuery,
  useGetEstatePaymentStatusQuery,
  useGetComplaintAnalyticsQuery,
  useGetComplaintTrendsQuery,
  useGetTenancyExpiryDashboardQuery,
  useGetTenantsExpiringQuery,
  useGetPaymentAlertsQuery,
  useGetPaymentReportQuery,
  useGetOccupancyReportQuery,
  useGetComplaintReportQuery,
  useExportReportMutation,
} = ownerApi;