export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  lastVisitDate?: string;
}

export interface PatientVisit {
  id: string;
  date: string;
  doctorName: string;
  diagnosis: string;
}
