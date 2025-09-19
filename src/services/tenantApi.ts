import { apiSlice } from '../store';
import type { Tenant, TenantType } from '../types/api';

export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Tenant Types
    createTenantType: builder.mutation<TenantType, { name: string }>({
      query: (tenantType) => ({
        url: '/api/tenants/tenant-types/',
        method: 'POST',
        body: tenantType,
      }),
      invalidatesTags: ['Tenant'],
    }),

    getTenantTypes: builder.query<TenantType[], void>({
      query: () => '/api/tenants/tenant-types/',
      providesTags: ['Tenant'],
    }),

    // Tenants
    createTenant: builder.mutation<Tenant, Partial<Tenant>>({
      query: (tenant) => ({
        url: '/api/tenants/tenants/',
        method: 'POST',
        body: tenant,
      }),
      invalidatesTags: ['Tenant'],
    }),

    getTenants: builder.query<Tenant[], { apartment_id?: number; tenant_type_id?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.apartment_id) searchParams.append('apartment_id', params.apartment_id.toString());
        if (params.tenant_type_id) searchParams.append('tenant_type_id', params.tenant_type_id.toString());
        return `/api/tenants/tenants/?${searchParams.toString()}`;
      },
      providesTags: ['Tenant'],
    }),

    getTenantsByEstate: builder.query<Tenant[], number>({
      query: (estateId) => `/api/tenants/tenants/by_estate/?estate_id=${estateId}`,
      providesTags: ['Tenant'],
    }),

    // Rent Alerts
    getMyRentAlerts: builder.query<any, void>({
      query: () => '/api/payments/payments/my_rent_alerts/',
      providesTags: ['Payment'],
    }),

    // Payment Status & Receipts
    getPaymentReceiptStatus: builder.query<any, void>({
      query: () => '/api/payments/payments/payment_receipt_status/',
      providesTags: ['Payment'],
    }),

    getMyPayments: builder.query<any[], void>({
      query: () => '/api/payments/payments/my_payments/',
      providesTags: ['Payment'],
    }),

    // Complaints
    getComplaintCategories: builder.query<any[], void>({
      query: () => '/api/complaints/complaints/complaint_categories/',
      providesTags: ['Complaint'],
    }),

    getMyComplaints: builder.query<any[], void>({
      query: () => '/api/complaints/complaints/my_complaints/',
      providesTags: ['Complaint'],
    }),

    logComplaint: builder.mutation<any, FormData | Record<string, any>>({
      query: (body) => ({
        url: '/api/complaints/complaints/log_complaint/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Complaint'],
    }),

    logPayment: builder.mutation<any, FormData | Record<string, any>>({
      query: (body) => ({
        url: '/api/payments/payments/log_payment/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment'],
    }),

    updateComplaint: builder.mutation<any, { id: number | string; data: FormData | Record<string, any> }>({
      query: ({ id, data }) => ({
        url: `/api/complaints/complaints/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Complaint'],
    }),
  }),
});

export const {
  useCreateTenantTypeMutation,
  useGetTenantTypesQuery,
  useCreateTenantMutation,
  useGetTenantsQuery,
  useGetTenantsByEstateQuery,
  useGetMyRentAlertsQuery,
  useGetPaymentReceiptStatusQuery,
  useGetMyPaymentsQuery,
  useLogPaymentMutation,
  useGetComplaintCategoriesQuery,
  useGetMyComplaintsQuery,
  useLogComplaintMutation,
  useUpdateComplaintMutation,
} = tenantApi;