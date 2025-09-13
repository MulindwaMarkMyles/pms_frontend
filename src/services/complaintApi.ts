import { apiSlice } from '../store';
import type { ComplaintItem, ComplaintStatus, ComplaintStatusUpdate } from '../types/api';

export const complaintApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Complaint Statuses
    createComplaintStatus: builder.mutation<ComplaintStatus, { name: string }>({
      query: (status) => ({
        url: '/api/complaints/complaint-statuses/',
        method: 'POST',
        body: status,
      }),
      invalidatesTags: ['Complaint'],
    }),

    getComplaintStatuses: builder.query<ComplaintStatus[], void>({
      query: () => '/api/complaints/complaint-statuses/',
      providesTags: ['Complaint'],
    }),

    // Complaints
    getComplaints: builder.query<ComplaintItem[], { status_id?: number; tenant_id?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.status_id) searchParams.append('status_id', params.status_id.toString());
        if (params.tenant_id) searchParams.append('tenant_id', params.tenant_id.toString());
        return `/api/complaints/complaints/?${searchParams.toString()}`;
      },
      providesTags: ['Complaint'],
    }),

    updateComplaintStatus: builder.mutation<ComplaintItem, { id: number; update: ComplaintStatusUpdate }>({
      query: ({ id, update }) => ({
        url: `/api/complaints/complaints/${id}/update_status/`,
        method: 'PATCH',
        body: update,
      }),
      invalidatesTags: ['Complaint'],
    }),

    closeComplaint: builder.mutation<ComplaintItem, number>({
      query: (id) => ({
        url: `/api/complaints/complaints/${id}/close/`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Complaint'],
    }),
  }),
});

export const {
  useCreateComplaintStatusMutation,
  useGetComplaintStatusesQuery,
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useCloseComplaintMutation,
} = complaintApi;