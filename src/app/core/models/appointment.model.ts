export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // denormalized for UI
  doctorId: string;
  doctorName: string; // denormalized for UI
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
