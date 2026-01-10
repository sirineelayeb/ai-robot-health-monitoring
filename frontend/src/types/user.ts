// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'maintenance_engineer';
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DashboardResponse {
  message: string;
  user: User;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}