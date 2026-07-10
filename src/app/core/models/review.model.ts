export interface CreateReviewRequest {
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  prescriptionId?: string;
  rating: number;
  reviewText?: string;
}

export interface ReviewResponse {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  rating: number;
  reviewText: string;
  isApproved: boolean;
  createdAt: string;
}
