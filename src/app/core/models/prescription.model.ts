export interface PrescriptionMedicine {
  id?: string;
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  instructions?: string;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
}

export interface Prescription {
  id: string;
  consultationId: string;
  appointmentId?: string;
  doctor: { id: string; fullName: string; specialization?: string };
  patient: { id: string; fullName: string; patientId?: string };
  diagnosis?: string;
  date?: string;
  medicines: PrescriptionMedicine[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePrescriptionRequest {
  consultationId: string;
  diagnosis?: string;
  medicines: PrescriptionMedicine[];
  notes?: string;
}

export interface UpdatePrescriptionRequest {
  diagnosis?: string;
  notes?: string;
  medicines?: PrescriptionMedicine[];
}
