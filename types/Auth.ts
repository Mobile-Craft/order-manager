// ==========================
// 🔹 ROLES
// ==========================

// Rol completo dentro del sistema
export type AppRole = 'Admin' | 'Cajero' | 'Cocina';

// Roles que pueden ser invitados por el Admin
export type EmployeeRole = Exclude<AppRole, 'Admin'>; // = 'Cajero' | 'Cocina'


// ==========================
// 🔹 ENTIDADES PRINCIPALES
// ==========================

export interface Business {
  id: string;
  name: string;
  owner_id?: string; // ← opcional, por si deseas guardar el dueño
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  business_id: string;
  full_name: string;
  role: AppRole; // ← usa el tipo global
  created_at: string;
  updated_at: string;
}

export interface BusinessInvitation {
  id: string;
  business_id: string;
  email: string;
  role: EmployeeRole; // ← solo puede invitar Cajero o Cocina
  invited_by: string;
  accepted: boolean;
  created_at: string;
  expires_at: string;
}

// ==========================
// 🔹 AUTENTICACIÓN Y REGISTRO
// ==========================

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
