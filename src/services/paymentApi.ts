import { apiSlice } from '../store';

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all payments with detailed information (tenant, apartment, status details)
    getPayments: builder.query<any[], { tenant_id?: number; status_id?: number; month?: number; year?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.tenant_id) searchParams.append('tenant_id', params.tenant_id.toString());
        if (params.status_id) searchParams.append('status_id', params.status_id.toString());
        if (params.month) searchParams.append('month', params.month.toString());
        if (params.year) searchParams.append('year', params.year.toString());
        return `/api/payments/payments/?${searchParams.toString()}`;
      },
      providesTags: ['Payment'],
    }),

    // Get single payment with all details
    getSinglePayment: builder.query<any, number>({
      query: (id) => `/api/payments/payments/${id}/`,
      providesTags: ['Payment'],
    }),

    // Get pending payments with detailed information
    getPendingPayments: builder.query<any[], void>({
      query: () => '/api/payments/payments/pending_payments/',
      providesTags: ['Payment'],
    }),

    // Get overdue payments with detailed information  
    getOverduePayments: builder.query<any[], void>({
      query: () => '/api/payments/payments/overdue_payments/',
      providesTags: ['Payment'],
    }),

    // Get payment statuses
    getPaymentStatuses: builder.query<any[], void>({
      query: () => '/api/payments/payment-statuses/',
      providesTags: ['Payment'],
    }),

    // Create payment status
    createPaymentStatus: builder.mutation<any, { name: string }>({
      query: (data) => ({
        url: '/api/payments/payment-statuses/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Create payment record
    createPayment: builder.mutation<any, any>({
      query: (data) => ({
        url: '/api/payments/payments/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Update payment status with month selection
    updatePaymentStatus: builder.mutation<any, { id: number; update: any }>({
      query: ({ id, update }) => ({
        url: `/api/payments/payments/${id}/update_payment_status/`,
        method: 'PATCH',
        body: update,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Delete payment record
    deletePayment: builder.mutation<any, number>({
      query: (id) => ({
        url: `/api/payments/payments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetSinglePaymentQuery,
  useGetPendingPaymentsQuery,
  useGetOverduePaymentsQuery,
  useGetPaymentStatusesQuery,
  useCreatePaymentMutation,
  useCreatePaymentStatusMutation,
  useUpdatePaymentStatusMutation,
  useDeletePaymentMutation,
} = paymentApi;