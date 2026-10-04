/** Inpatients (IPD): wards and beds, admissions and the stay's account. Money is in paisa. */

export type WardType =
  | 'GENERAL'
  | 'SEMI_PRIVATE'
  | 'PRIVATE'
  | 'DELUXE'
  | 'ICU'
  | 'NICU'
  | 'PICU'
  | 'HDU'
  | 'MATERNITY'
  | 'DAY_CARE'
  | 'EMERGENCY'
  | 'ISOLATION';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
export type AdmissionStatus = 'ADMITTED' | 'DISCHARGE_ADVISED' | 'DISCHARGED';
export type AdmissionType = 'PLANNED' | 'EMERGENCY' | 'DAY_CARE' | 'MATERNITY';
export type DischargeType = 'NORMAL' | 'ON_REQUEST' | 'LAMA' | 'REFERRED' | 'ABSCONDED' | 'DEATH';
export type ChargeCategory = 'DOCTOR_VISIT' | 'NURSING' | 'PROCEDURE' | 'MEDICINE' | 'INVESTIGATION' | 'CONSUMABLE' | 'OTHER';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING';

export const WARD_TYPES: { value: WardType; label: string }[] = [
  { value: 'GENERAL', label: 'General ward' },
  { value: 'SEMI_PRIVATE', label: 'Semi-private' },
  { value: 'PRIVATE', label: 'Private room' },
  { value: 'DELUXE', label: 'Deluxe room' },
  { value: 'ICU', label: 'ICU' },
  { value: 'NICU', label: 'NICU' },
  { value: 'PICU', label: 'PICU' },
  { value: 'HDU', label: 'HDU' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'DAY_CARE', label: 'Day care' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'ISOLATION', label: 'Isolation' },
];

export const ADMISSION_TYPES: { value: AdmissionType; label: string }[] = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'DAY_CARE', label: 'Day care' },
  { value: 'MATERNITY', label: 'Maternity' },
];

export const DISCHARGE_TYPES: { value: DischargeType; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ON_REQUEST', label: 'On request' },
  { value: 'LAMA', label: 'LAMA (against advice)' },
  { value: 'REFERRED', label: 'Referred' },
  { value: 'ABSCONDED', label: 'Absconded' },
  { value: 'DEATH', label: 'Death' },
];

export const CHARGE_CATEGORIES: { value: ChargeCategory; label: string; icon: string }[] = [
  { value: 'DOCTOR_VISIT', label: 'Doctor visit', icon: 'stethoscope' },
  { value: 'NURSING', label: 'Nursing', icon: 'vaccines' },
  { value: 'PROCEDURE', label: 'Procedure', icon: 'healing' },
  { value: 'MEDICINE', label: 'Medicines', icon: 'medication' },
  { value: 'INVESTIGATION', label: 'Tests', icon: 'biotech' },
  { value: 'CONSUMABLE', label: 'Consumables', icon: 'inventory_2' },
  { value: 'OTHER', label: 'Other', icon: 'more_horiz' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'NET_BANKING', label: 'Net banking' },
];

export interface Occupant {
  admissionId: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  admittedAt: string;
  status: AdmissionStatus;
  days: number;
}

export interface BedView {
  id: string;
  bedNumber: string;
  status: BedStatus;
  notes: string | null;
  occupant: Occupant | null;
}

export interface WardView {
  id: string;
  name: string;
  wardType: WardType;
  floor: string | null;
  dailyRateInPaisa: number;
  departmentId: string | null;
  departmentName: string | null;
  beds: BedView[];
  total: number;
  occupied: number;
  available: number;
  cleaning: number;
  maintenance: number;
}

export interface BedBoard {
  wards: WardView[];
  total: number;
  occupied: number;
  available: number;
  cleaning: number;
  maintenance: number;
}

export interface WardRequest {
  name: string;
  wardType: WardType;
  floor: string | null;
  dailyRateInPaisa: number;
  departmentId: string | null;
}

export interface DepositRequest {
  amountInPaisa: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

export interface AdmitRequest {
  patientId: string;
  doctorId: string;
  bedId: string;
  admissionType: AdmissionType;
  reason: string;
  provisionalDiagnosis?: string | null;
  attendantName?: string | null;
  attendantRelation?: string | null;
  attendantPhone?: string | null;
  deposit?: DepositRequest | null;
}

export interface ChargeRequest {
  category: ChargeCategory;
  description: string;
  quantity: number;
  unitPriceInPaisa: number;
  chargedOn?: string | null;
}

export interface DischargeSummaryRequest {
  finalDiagnosis: string;
  treatmentGiven?: string | null;
  conditionAtDischarge?: string | null;
  dischargeAdvice?: string | null;
  followUpDate?: string | null;
  dischargeType: DischargeType;
}

export interface StayView {
  bedId: string;
  bedNumber: string;
  wardName: string;
  dailyRateInPaisa: number;
  fromTime: string;
  toTime: string | null;
  reason: string | null;
  days: number;
  amountInPaisa: number;
}

export interface ChargeView {
  id: string;
  category: ChargeCategory;
  description: string;
  quantity: number;
  unitPriceInPaisa: number;
  amountInPaisa: number;
  chargedOn: string;
  addedBy: string | null;
}

export interface DepositView {
  id: string;
  kind: 'DEPOSIT' | 'REFUND';
  amountInPaisa: number;
  paymentMethod: PaymentMethod;
  reference: string | null;
  receivedAt: string;
  receivedBy: string | null;
}

/** Before the final bill the total is an estimate; balance below zero is owed back to the patient. */
export interface Account {
  bedChargesInPaisa: number;
  otherChargesInPaisa: number;
  discountInPaisa: number;
  taxInPaisa: number;
  totalInPaisa: number;
  finalBill: boolean;
  depositsInPaisa: number;
  refundsInPaisa: number;
  paidOnBillInPaisa: number;
  balanceInPaisa: number;
}

export interface AdmissionSummary {
  id: string;
  admissionNumber: string;
  status: AdmissionStatus;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorId: string;
  doctorName: string;
  bedId: string | null;
  bedNumber: string | null;
  wardName: string | null;
  admissionType: AdmissionType;
  admittedAt: string;
  dischargedAt: string | null;
  days: number;
}

export interface AdmissionView {
  id: string;
  admissionNumber: string;
  status: AdmissionStatus;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientPhone: string | null;
  patientGender: string | null;
  patientAge: number | null;
  doctorId: string;
  doctorName: string;
  departmentId: string | null;
  departmentName: string | null;
  bedId: string | null;
  bedNumber: string | null;
  wardId: string | null;
  wardName: string | null;
  wardType: WardType | null;
  admissionType: AdmissionType;
  admittedAt: string;
  reason: string;
  attendantName: string | null;
  attendantRelation: string | null;
  attendantPhone: string | null;
  /** Whether the clinical parts are shown to this user. */
  clinical: boolean;
  provisionalDiagnosis: string | null;
  finalDiagnosis: string | null;
  treatmentGiven: string | null;
  conditionAtDischarge: string | null;
  dischargeAdvice: string | null;
  followUpDate: string | null;
  dischargeType: DischargeType | null;
  advisedAt: string | null;
  advisedBy: string | null;
  dischargedAt: string | null;
  dischargedBy: string | null;
  duesNote: string | null;
  billId: string | null;
  billNumber: string | null;
  days: number;
  stays: StayView[];
  charges: ChargeView[];
  deposits: DepositView[];
  account: Account;
}

export function rupees(paisa: number | null | undefined): string {
  return '₹' + ((paisa ?? 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function labelOf<T extends string>(list: { value: T; label: string }[], value: T | null | undefined): string {
  return list.find((x) => x.value === value)?.label ?? (value ?? '');
}
