export interface Vitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  spo2?: number;
  pulse?: number;
  recordedAt?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  chiefComplaints: string;
  examinationFindings?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  vitals?: Vitals;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ConsultationStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface CreateConsultationRequest {
  appointmentId: string;
  chiefComplaints: string;
  examinationFindings?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  vitals?: Vitals;
}
