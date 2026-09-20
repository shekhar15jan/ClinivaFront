export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  licenseNumber?: string;
  experienceYears?: number;
  consultationFeeInPaisa: number;
  phone?: string;
  email?: string;
  profilePhotoUrl?: string;
  isActive: boolean;
}

export interface AvailabilityDto {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface DoctorWithSlotsResponse {
  doctor: Doctor;
  availability: AvailabilityDto[];
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  isActive: boolean;
}

/** What PUT /hms/doctors/{id}/availability takes: the doctor's whole weekly schedule, replaced as one. */
export interface UpdateAvailabilityRequest {
  availability: AvailabilityDto[];
}
