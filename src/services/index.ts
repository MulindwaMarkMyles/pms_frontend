// Export all API services and hooks
export * from './authApi';
export * from './propertyApi';
export * from './tenantApi';
export * from './complaintApi';
export * from './paymentApi';

// Re-export from API slice
export { 
  apiSlice, 
  useLoginMutation, 
  useRefreshTokenMutation,
  useGetUserProfileQuery,
  useRegisterMutation
} from './apiSlice';

// Re-export all tenant API hooks
export {
  useGetMyRentAlertsQuery,
  useGetPaymentReceiptStatusQuery,
  useGetMyPaymentsQuery,
  useLogPaymentMutation,
  useGetComplaintCategoriesQuery,
  useGetMyComplaintsQuery,
  useLogComplaintMutation,
} from './tenantApi';

// Re-export auth slice
export {
  setCredentials,
  updateTokens,
  updateUser,
  logout,
  clearAuth,
  selectCurrentUser,
  selectCurrentToken,
  selectRefreshToken,
  selectIsAuthenticated,
  selectUserRole,
  selectUserDisplayName,
  type User,
  type AuthState,
  type LoginResponse,
} from './authSlice';

// Re-export store hooks
export { useAppDispatch, useAppSelector } from '../store';

