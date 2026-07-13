export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface PatientSummary {
  id: string;
  patientId?: string;
  fullName: string;
  phone?: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  specialization?: string;
}

export interface Appointment {
  id: string;
  patient: PatientSummary;
  doctor: DoctorSummary;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}
