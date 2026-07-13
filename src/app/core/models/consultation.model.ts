export interface Vitals {
  bp?: string;
  temperature?: string;
  weight?: string;
  spo2?: string;
  pulse?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaints: string;
  examinationFindings?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  vitals?: Vitals;
  createdAt: string;
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
