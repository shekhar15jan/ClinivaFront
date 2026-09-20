export interface CreateReviewRequest {
  /** Ignored by the server, which uses the signed-in patient and the visit's doctor. */
  patientId?: string;
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
