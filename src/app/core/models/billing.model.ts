export interface Bill {
  id: string;
  billNumber?: string;
  patient: { id: string; fullName: string; patientId?: string };
  appointmentId: string;
  prescriptionId?: string;
  consultationFeeInPaisa: number;
  medicineChargesInPaisa?: number;
  additionalChargesInPaisa?: number;
  discountInPaisa: number;
  taxInPaisa: number;
  totalAmountInPaisa: number;
  paymentStatus: BillStatus;
  billDate?: string;
  isVoided?: boolean;
  voidReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface CreateBillRequest {
  prescriptionId: string;
  additionalChargesInPaisa?: number;
  discountInPaisa?: number;
  taxInPaisa?: number;
}

export interface UpdateBillRequest {
  additionalChargesInPaisa?: number;
  discountInPaisa?: number;
  taxInPaisa?: number;
}
