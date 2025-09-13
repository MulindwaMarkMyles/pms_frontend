// Core property management types
export interface Estate {
  id?: number;
  name: string;
  address: string;
  size: string;
  description: string;
}

export interface Block {
  id?: number;
  estate: number;
  name: string;
  description: string;
}

// Complaint Management Types
export interface ComplaintStatus {
  id: number;
  name: string;
}

export interface ComplaintItem {
  id?: number;
  tenant: number;
  tenant_details?: {
    id: number;
    user_details: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    apartment_details: {
      id: number;
      number: string;
      block: {
        id: number;
        name: string;
        estate: {
          id: number;
          name: string;
          address: string;
        };
      };
    };
  };
  description: string;
  status: number;
  status_details?: {
    id: number;
    name: string;
  };
  feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComplaintStatusUpdate {
  status_id: number;
  feedback: string;
}

// Payment Management Types
export interface PaymentStatus {
  id: number;
  name: string;
}

export interface Payment {
  id?: number;
  tenant: number;
  tenant_details?: {
    id: number;
    user: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    apartment: {
      number: string;
      block: {
        id: number;
        name: string;
        estate: {
          id: number;
          name: string;
        };
      };
    };
  };
  amount: string;
  status: number;
  status_details?: {
    id: number;
    name: string;
  };
  due_date: string;
  paid_at?: string;
  payment_for_month: number;
  payment_for_year: number;
  payment_method?: string;
  reference_number?: string;
  created_at?: string;
}

export interface CreatePaymentRequest {
  tenant: number;
  amount: number;
  status: number;
  due_date: string;
  payment_for_month: number;
  payment_for_year: number;
}

export interface UpdatePaymentStatusRequest {
  status_id: number;
  months_paid: number[];
  payment_method: string;
  reference_number: string;
  notes: string;
}

export interface Amenity {
  id: number;
  name: string;
  description?: string;
}

export interface Furnishing {
  id: number;
  name: string;
  description?: string;
}

// Complaint Management Types
export interface ComplaintStatus {
  id: number;
  name: string;
}

export interface Complaint {
  id?: number;
  tenant: number;
  tenant_details?: {
    id: number;
    user_details: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    apartment_details: {
      id: number;
      number: string;
      block: {
        id: number;
        name: string;
        estate: {
          id: number;
          name: string;
          address: string;
        };
      };
    };
  };
  description: string;
  status: number;
  status_details?: {
    id: number;
    name: string;
  };
  feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateComplaintRequest {
  tenant: number;
  description: string;
  status: number;
}

export interface CreateComplaintStatusRequest {
  name: string;
}

export interface Apartment {
  id?: number;
  block: number;
  number: string;
  size: number;
  amenities: number[];
  furnishings: number[];
  rent_amount: number;
  number_of_rooms: number;
  color: string;
  description: string;
}

export interface AvailableApartment {
  id: number;
  number: string;
  size: string;
  rent_amount: string;
  number_of_rooms: number;
  color: string;
  description: string;
  created_at: string;
  block: number | {
    id: number;
    name: string;
    estate?: {
      id: number;
      name: string;
      address?: string;
    };
  }; // Can be either ID or detailed object
  amenities: Amenity[];
  furnishings: Furnishing[];
}

// Tenant management types
export interface TenantType {
  id: number;
  name: string;
}

export interface TenantUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface Tenant {
  id?: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  tenant_type: number;
  tenant_type_details: {
    id: number;
    name: string;
    description: string;
  };
  apartment: number;
  apartment_details: {
    id: number;
    number: string;
    size: string;
    rent_amount: string;
    number_of_rooms: number;
    block: {
      id: number;
      name: string;
      estate: {
        id: number;
        name: string;
        address: string;
      };
    };
  };
  lease_start: string;
  lease_end: string;
  phone_number: string;
  emergency_contact: string;
  created_at?: string;
}

// Complaint types
export interface ComplaintStatus {
  id: number;
  name: string;
}

export interface Complaint {
  id: number;
  tenant_id: number;
  status_id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintStatusUpdate {
  status_id: number;
  feedback: string;
}

// Payment types
export interface PaymentStatus {
  id: number;
  name: string;
}

export interface Payment {
  id?: number;
  tenant: number;
  amount: number;
  status: number;
  due_date: string;
  payment_for_month: number;
  payment_for_year: number;
}

export interface PaymentStatusUpdate {
  status_id: number;
  months_paid: number[];
  paid_amount: number;
  payment_method: string;
  reference_number: string;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  phone_number: string;
  address: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  profile: UserProfile;
  tokens: TokenResponse;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}