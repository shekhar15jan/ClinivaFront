/** What any signed-in user of the clinic may read: shown on invoices, prescriptions and the portal. */
export interface ClinicProfile {
  clinicName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

export interface ClinicSettings {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  patientIdPrefix: string;
  currency: string;
  timezone: string;
  defaultConsultationFeeInPaisa: number;
  enableOnlinePayment: boolean;
  enableOtpLogin: boolean;
  /** GST applied to new bills, e.g. 18. */
  taxRatePercent?: number;
  /** The clinic's own UPI ID for QR payments. */
  upiPayeeId?: string | null;
  /** Sender name on the clinic's emails; the clinic name when empty. */
  emailSenderName?: string | null;
  /** API path of the clinic logo; see mediaUrl(). */
  logoUrl?: string | null;
  /** The clinic's own Razorpay account. Secrets are write-only: the server says only whether they are set. */
  razorpayKeyId?: string | null;
  razorpayKeySecretSet?: boolean;
  razorpayWebhookSecretSet?: boolean;
  /** Sent only when changed; an empty string removes it. */
  razorpayKeySecret?: string | null;
  razorpayWebhookSecret?: string | null;
  /** The last part of this clinic's Razorpay webhook address. */
  clinicCode?: string | null;
}
