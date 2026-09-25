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
}
