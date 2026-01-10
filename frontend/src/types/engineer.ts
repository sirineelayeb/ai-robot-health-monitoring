// types/engineer.ts
export interface Engineer {
  _id: string;
  id: string; // For backward compatibility
  name: string;
  email: string;
  role: 'admin' | 'maintenance_engineer' | 'viewer';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEngineerData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateEngineerData {
  name?: string;
  email?: string;
  isActive?: boolean;
  password?: string;
}