/**
 * Whether the signed-in clinician sees this patient's clinical record. `restricted`: only department access stands
 * in the way, so emergency access is offered; `emergencyUntil`: emergency access is open until then.
 */
export interface ClinicalAccess {
  clinical: boolean;
  restricted: boolean;
  emergencyUntil: string | null;
}

export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  /** ABDM identifiers. */
  abhaNumber?: string | null;
  abhaAddress?: string | null;
  medicalHistory?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitItem {
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  status: string;
  consultation?: string;
  prescription?: string;
  bill?: string;
}

export interface PatientVisitResponse {
  patientId: string;
  patientName: string;
  visits: VisitItem[];
}
