/** The laboratory: catalog, orders, items and results. Money in paisa. */

export type LabCategory = 'HAEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'PATHOLOGY' | 'SEROLOGY' | 'HORMONES' | 'URINE' | 'OTHER';
export type SampleType = 'BLOOD' | 'SERUM' | 'URINE' | 'STOOL' | 'SWAB' | 'SPUTUM' | 'CSF' | 'TISSUE' | 'OTHER';
export type OrderStatus = 'ORDERED' | 'COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'COLLECTED' | 'RESULTED' | 'VERIFIED' | 'CANCELLED';
export type Flag = 'NORMAL' | 'LOW' | 'HIGH' | 'ABNORMAL';
export type Priority = 'ROUTINE' | 'URGENT';

export const LAB_CATEGORIES: { value: LabCategory; label: string }[] = [
  { value: 'HAEMATOLOGY', label: 'Haematology' },
  { value: 'BIOCHEMISTRY', label: 'Biochemistry' },
  { value: 'MICROBIOLOGY', label: 'Microbiology' },
  { value: 'PATHOLOGY', label: 'Pathology' },
  { value: 'SEROLOGY', label: 'Serology' },
  { value: 'HORMONES', label: 'Hormones' },
  { value: 'URINE', label: 'Urine' },
  { value: 'OTHER', label: 'Other' },
];

export const SAMPLE_TYPES: SampleType[] = ['BLOOD', 'SERUM', 'URINE', 'STOOL', 'SWAB', 'SPUTUM', 'CSF', 'TISSUE', 'OTHER'];

export interface ParameterView {
  id: string;
  name: string;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refText: string | null;
  reference: string | null;
}

export interface TestView {
  id: string;
  code: string;
  name: string;
  category: LabCategory;
  sampleType: SampleType;
  priceInPaisa: number;
  turnaroundHours: number;
  active: boolean;
  parameters: ParameterView[];
}

export interface TestRequest {
  code: string;
  name: string;
  category: LabCategory;
  sampleType: SampleType;
  priceInPaisa: number;
  turnaroundHours: number;
  parameters: { name: string; unit: string | null; refLow: number | null; refHigh: number | null; refText: string | null }[];
}

export interface ResultView {
  name: string;
  unit: string | null;
  value: string;
  reference: string | null;
  flag: Flag | null;
}

export interface ItemView {
  id: string;
  testId: string;
  testName: string;
  priceInPaisa: number;
  status: ItemStatus;
  sampleNumber: string | null;
  collectedAt: string | null;
  collectedBy: string | null;
  resultedAt: string | null;
  resultedBy: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  comment: string | null;
  parameters: ParameterView[];
  results: ResultView[];
}

export interface OrderView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  priority: Priority;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientAge: number | null;
  patientGender: string | null;
  doctorId: string | null;
  doctorName: string | null;
  admissionId: string | null;
  admissionNumber: string | null;
  clinicalNote: string | null;
  orderedAt: string;
  orderedBy: string | null;
  billId: string | null;
  billNumber: string | null;
  cancelReason: string | null;
  totalInPaisa: number;
  /** Whether the results are shown to this user. */
  results: boolean;
  items: ItemView[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  priority: Priority;
  patientName: string;
  patientCode: string;
  doctorName: string | null;
  inpatient: boolean;
  orderedAt: string;
  tests: number;
  abnormal: number;
}

/** Reads a typed value against the parameter's range, as the server will. */
export function flagOf(p: ParameterView, value: string): Flag | null {
  const v = value.trim();
  if (!v) return null;
  if (p.refLow !== null || p.refHigh !== null) {
    const n = Number(v.replace(/,/g, ''));
    if (Number.isNaN(n)) return 'ABNORMAL';
    if (p.refLow !== null && n < p.refLow) return 'LOW';
    if (p.refHigh !== null && n > p.refHigh) return 'HIGH';
    return 'NORMAL';
  }
  if (p.refText) return p.refText.trim().toLowerCase() === v.toLowerCase() ? 'NORMAL' : 'ABNORMAL';
  return null;
}

export const FLAG_STYLE: Record<Flag, string> = {
  NORMAL: 'text-emerald-700',
  LOW: 'text-blue-700 font-bold',
  HIGH: 'text-red-700 font-bold',
  ABNORMAL: 'text-red-700 font-bold',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  ORDERED: 'To collect',
  COLLECTED: 'In the lab',
  IN_PROGRESS: 'Results in',
  COMPLETED: 'Reported',
  CANCELLED: 'Cancelled',
};
