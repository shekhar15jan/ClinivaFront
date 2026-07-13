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
}
