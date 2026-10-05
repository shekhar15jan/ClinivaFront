export interface Bill {
  id: string;
  billNumber?: string;
  patient: { id: string; fullName: string; patientId?: string };
  /** Empty on an inpatient final bill. */
  appointmentId: string | null;
  /** The inpatient stay a final bill is for. */
  admissionId?: string | null;
  /** The lab order an outpatient's lab bill is for. */
  labOrderId?: string | null;
  /** The imaging order an outpatient's radiology bill is for. */
  imagingOrderId?: string | null;
  prescriptionId?: string;
  consultationFeeInPaisa: number;
  medicineChargesInPaisa?: number;
  additionalChargesInPaisa?: number;
  discountInPaisa: number;
  taxInPaisa: number;
  totalAmountInPaisa: number;
  paymentStatus: BillStatus;
  /** Received so far, part-payments included; the amount due is the total less this. */
  amountPaidInPaisa?: number;
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

/** What is still owed on a bill, in paise (never below zero). */
export function amountDueInPaisa(bill: Pick<Bill, 'totalAmountInPaisa' | 'amountPaidInPaisa' | 'paymentStatus'>): number {
  if (bill.paymentStatus === 'PAID') return 0;
  return Math.max(0, (bill.totalAmountInPaisa || 0) - (bill.amountPaidInPaisa || 0));
}
