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
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface SavePaymentRequest {
  billId: string;
  amountInPaisa: number;
  paymentMethod: string;
  paymentMode: string;
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
}
