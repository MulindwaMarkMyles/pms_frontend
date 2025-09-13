import { apiSlice } from '../store';
import type { 
  Estate, 
  Block, 
  Apartment, 
  AvailableApartment, 
  Amenity, 
  Furnishing 
} from '../types/api';

export const propertyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Estates
    createEstate: builder.mutation<Estate, Partial<Estate>>({
      query: (estate) => ({
        url: '/api/core/estates/',
        method: 'POST',
        body: estate,
      }),
      invalidatesTags: ['Property'],
    }),
    
    getEstates: builder.query<Estate[], void>({
      query: () => '/api/core/estates/',
      providesTags: ['Property'],
    }),

    // Blocks
    createBlock: builder.mutation<Block, Partial<Block>>({
      query: (block) => ({
        url: '/api/core/blocks/',
        method: 'POST',
        body: block,
      }),
      invalidatesTags: ['Property'],
    }),

    getBlocksByEstate: builder.query<Block[], number>({
      query: (estateId) => `/api/core/blocks/?estate_id=${estateId}`,
      providesTags: ['Property'],
    }),

    // Apartments
    createApartment: builder.mutation<Apartment, Partial<Apartment>>({
      query: (apartment) => ({
        url: '/api/core/apartments/',
        method: 'POST',
        body: apartment,
      }),
      invalidatesTags: ['Property'],
    }),

    getAvailableApartments: builder.query<AvailableApartment[], void>({
      query: () => '/api/core/apartments/available/',
      providesTags: ['Property'],
    }),

    // Amenities
    createAmenity: builder.mutation<Amenity, { name: string }>({
      query: (amenity) => ({
        url: '/api/core/amenities/',
        method: 'POST',
        body: amenity,
      }),
      invalidatesTags: ['Property'],
    }),

    getAmenities: builder.query<Amenity[], void>({
      query: () => '/api/core/amenities/',
      providesTags: ['Property'],
    }),

    // Furnishings
    createFurnishing: builder.mutation<Furnishing, { name: string }>({
      query: (furnishing) => ({
        url: '/api/core/furnishings/',
        method: 'POST',
        body: furnishing,
      }),
      invalidatesTags: ['Property'],
    }),

    getFurnishings: builder.query<Furnishing[], void>({
      query: () => '/api/core/furnishings/',
      providesTags: ['Property'],
    }),
  }),
});

export const {
  useCreateEstateMutation,
  useGetEstatesQuery,
  useCreateBlockMutation,
  useGetBlocksByEstateQuery,
  useCreateApartmentMutation,
  useGetAvailableApartmentsQuery,
  useCreateAmenityMutation,
  useGetAmenitiesQuery,
  useCreateFurnishingMutation,
  useGetFurnishingsQuery,
} = propertyApi;