export interface PrescriptionMedicine {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
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
