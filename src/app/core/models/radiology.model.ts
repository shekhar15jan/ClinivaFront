/** Radiology: catalog, orders and studies with their reports. Money in paisa. */

export type Modality = 'XRAY' | 'ULTRASOUND' | 'CT' | 'MRI' | 'MAMMOGRAPHY' | 'FLUOROSCOPY' | 'DEXA' | 'OTHER';
export type ImagingOrderStatus = 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ImagingItemStatus = 'ORDERED' | 'DONE' | 'REPORTED' | 'CANCELLED';
export type ImagingPriority = 'ROUTINE' | 'URGENT';

export const MODALITIES: { value: Modality; label: string; colour: string }[] = [
  { value: 'XRAY', label: 'X-ray', colour: 'bg-sky-600' },
  { value: 'ULTRASOUND', label: 'Ultrasound', colour: 'bg-teal-600' },
  { value: 'CT', label: 'CT', colour: 'bg-indigo-600' },
  { value: 'MRI', label: 'MRI', colour: 'bg-violet-600' },
  { value: 'MAMMOGRAPHY', label: 'Mammography', colour: 'bg-pink-600' },
  { value: 'FLUOROSCOPY', label: 'Fluoroscopy', colour: 'bg-amber-600' },
  { value: 'DEXA', label: 'DEXA', colour: 'bg-lime-700' },
  { value: 'OTHER', label: 'Other', colour: 'bg-slate-600' },
];

export function modalityLabel(m: Modality): string {
  return MODALITIES.find((x) => x.value === m)?.label ?? m;
}

export interface StudyView {
  id: string;
  code: string;
  name: string;
  modality: Modality;
  bodyPart: string | null;
  priceInPaisa: number;
  preparation: string | null;
  formFRequired: boolean;
  active: boolean;
}

export interface StudyRequest {
  code: string;
  name: string;
  modality: Modality;
  bodyPart: string | null;
  priceInPaisa: number;
  preparation: string | null;
  formFRequired: boolean;
}

export interface ImagingItemView {
  id: string;
  studyId: string;
  studyName: string;
  modality: Modality;
  priceInPaisa: number;
  status: ImagingItemStatus;
  preparation: string | null;
  formFRequired: boolean;
  formFNumber: string | null;
  scheduledAt: string | null;
  performedAt: string | null;
  performedBy: string | null;
  technicianNote: string | null;
  imageLink: string | null;
  findings: string | null;
  impression: string | null;
  reportedAt: string | null;
  reportedBy: string | null;
  addendum: string | null;
  addendumAt: string | null;
  addendumBy: string | null;
  comment: string | null;
}

export interface ImagingOrderView {
  id: string;
  orderNumber: string;
  status: ImagingOrderStatus;
  priority: ImagingPriority;
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
  /** Whether the reports are shown to this user. */
  reports: boolean;
  items: ImagingItemView[];
}

export interface ImagingOrderSummary {
  id: string;
  orderNumber: string;
  status: ImagingOrderStatus;
  priority: ImagingPriority;
  patientName: string;
  patientCode: string;
  doctorName: string | null;
  inpatient: boolean;
  orderedAt: string;
  studies: string[];
  toDo: number;
  toReport: number;
  nextScheduledAt: string | null;
}

export const IMAGING_STATUS_LABEL: Record<ImagingOrderStatus, string> = {
  ORDERED: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Reported',
  CANCELLED: 'Cancelled',
};
