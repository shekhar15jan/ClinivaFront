export interface BillLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceInPaisa: number;
  totalInPaisa: number;
}

export interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName?: string;
  consultationFeeInPaisa: number;
  lineItems: BillLineItem[];
  discountInPaisa: number;
  taxInPaisa: number;
  totalInPaisa: number;
  paidAmountInPaisa: number;
  dueAmountInPaisa: number;
  status: BillStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BillPreview {
  consultationFeeInPaisa: number;
  medicineCharges: { name: string; quantity: number; unitPriceInPaisa: number; totalInPaisa: number }[];
  totalInPaisa: number;
}

export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface CreateBillRequest {
  prescriptionId: string;
  additionalChargesInPaisa?: number;
  discountInPaisa?: number;
  taxInPaisa?: number;
}
