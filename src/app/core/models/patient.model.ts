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
