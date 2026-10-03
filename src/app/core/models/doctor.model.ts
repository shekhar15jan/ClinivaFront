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
  /** The department the doctor works in; none means clinic-wide. */
  departmentId?: string | null;
  departmentName?: string | null;
}

/** The doctors list: search by name or specialization, and filters (any left out). */
export interface DoctorFilter {
  q?: string;
  specialization?: string;
  departmentId?: string;
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
