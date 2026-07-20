export interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  fromEmail?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface EmailTemplateRequest {
  type: string;
  subject: string;
  body: string;
  fromEmail?: string;
}

export const EMAIL_TEMPLATE_TYPES = [
  { value: 'OTP', label: 'OTP Verification' },
  { value: 'APPOINTMENT_CONFIRMATION', label: 'Appointment Confirmation' },
  { value: 'APPOINTMENT_REJECTION', label: 'Appointment Rejection' },
  { value: 'APPOINTMENT_CANCELLATION', label: 'Appointment Cancellation' },
  { value: 'BILL_GENERATED', label: 'Bill Generated' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
];
