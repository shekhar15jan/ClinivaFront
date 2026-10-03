export interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  doctorCount: number;
  staffCount: number;
}

export interface DepartmentRequest {
  name: string;
  description?: string | null;
}

/** One emergency access ("break the glass"), for the review list. */
export interface EmergencyAccess {
  id: string;
  userId: string;
  userName: string | null;
  patientId: string;
  patientName: string | null;
  patientCode: string | null;
  reason: string;
  createdAt: string;
  expiresAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
}
