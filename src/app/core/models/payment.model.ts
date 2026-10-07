export interface CreateOrderRequest {
  billId: string;
  amountInPaisa: number;
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountInPaisa: number;
  currency: string;
  billId: string;
  /** Shown in the Razorpay window. */
  clinicName?: string | null;
  billNumber?: string | null;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface SavePaymentRequest {
  billId: string;
  /** Home currency; leave out when paying in the bill's foreign currency. */
  amountInPaisa?: number;
  paymentMethod: string;
  paymentMode: string;
  /** Paid in the bill's foreign currency (module MULTI_CURRENCY): that currency and the amount received in it. */
  currency?: string;
  amountInCurrencyMinor?: number;
}

export interface PaymentSummary {
  collectedInPaisa: number;
  successful: number;
  pendingOrFailed: number;
  total: number;
}

export interface PaymentResponse {
  id: string;
  billId: string;
  amountInPaisa: number;
  paymentMethod: string;
  paymentMode: string;
  paymentStatus: string;
  paidAt: string;
  createdAt: string;
  /** Who the payment was for and which bill, so it can be recognised without the bill id. */
  billNumber?: string | null;
  patientName?: string | null;
}
