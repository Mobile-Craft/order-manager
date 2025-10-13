export interface Business {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  business_id: string;
  full_name: string;
  role: 'Admin' | 'Cajero' | 'Cocina';
  created_at: string;
  updated_at: string;
}

export interface BusinessInvitation {
  id: string;
  business_id: string;
  email: string;
  role: 'Cajero' | 'Cocina';
  invited_by: string;
  accepted: boolean;
  created_at: string;
  expires_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
  business: Business;
}

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
}