/** Nursing for inpatients: vitals, medicine orders and doses, notes, and the ward round. */

export type Route = 'ORAL' | 'IV' | 'IM' | 'SC' | 'INHALED' | 'TOPICAL' | 'PR' | 'SL' | 'OTHER';
export type Frequency = 'OD' | 'BD' | 'TDS' | 'QID' | 'Q6H' | 'Q8H' | 'HS' | 'STAT' | 'SOS';
export type Outcome = 'GIVEN' | 'HELD' | 'REFUSED' | 'MISSED';
export type SlotState = Outcome | 'DUE' | 'OVERDUE' | 'UPCOMING';
export type NoteKind = 'NOTE' | 'HANDOVER' | 'INCIDENT';
export type Shift = 'MORNING' | 'EVENING' | 'NIGHT';

export const ROUTES: { value: Route; label: string }[] = [
  { value: 'ORAL', label: 'Oral' },
  { value: 'IV', label: 'IV' },
  { value: 'IM', label: 'IM' },
  { value: 'SC', label: 'SC' },
  { value: 'INHALED', label: 'Inhaled' },
  { value: 'TOPICAL', label: 'Topical' },
  { value: 'PR', label: 'PR' },
  { value: 'SL', label: 'SL' },
  { value: 'OTHER', label: 'Other' },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'OD', label: 'OD · once' },
  { value: 'BD', label: 'BD · twice' },
  { value: 'TDS', label: 'TDS · 3×' },
  { value: 'QID', label: 'QID · 4×' },
  { value: 'Q6H', label: '6-hourly' },
  { value: 'Q8H', label: '8-hourly' },
  { value: 'HS', label: 'HS · bedtime' },
  { value: 'STAT', label: 'STAT · now' },
  { value: 'SOS', label: 'SOS · as needed' },
];

export interface VitalsRequest {
  temperatureC?: number | null;
  pulse?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  respiratoryRate?: number | null;
  spo2?: number | null;
  painScore?: number | null;
  bloodSugar?: number | null;
  weightKg?: number | null;
  note?: string | null;
}

export interface VitalsView extends VitalsRequest {
  id: string;
  recordedAt: string;
  recordedBy: string | null;
  flags: string[];
}

export interface Slot {
  at: string;
  state: SlotState;
  outcome: Outcome | null;
  givenAt: string | null;
  by: string | null;
  note: string | null;
}

export interface OrderRequest {
  medicineName: string;
  dose: string;
  route: Route;
  frequency: Frequency;
  days?: number | null;
  instructions?: string | null;
}

export interface OrderView {
  id: string;
  medicineName: string;
  dose: string;
  route: Route;
  frequency: Frequency;
  startAt: string;
  endAt: string | null;
  instructions: string | null;
  status: 'ACTIVE' | 'STOPPED';
  orderedBy: string | null;
  orderedAt: string;
  stoppedAt: string | null;
  stoppedBy: string | null;
  stopReason: string | null;
  slots: Slot[];
}

export interface DoseView {
  id: string;
  orderId: string;
  medicineName: string;
  dose: string;
  scheduledAt: string | null;
  outcome: Outcome;
  givenAt: string;
  note: string | null;
  by: string | null;
}

export interface NoteView {
  id: string;
  kind: NoteKind;
  shift: Shift | null;
  text: string;
  by: string | null;
  at: string;
}

export interface Chart {
  admissionId: string;
  admissionNumber: string;
  patientName: string;
  patientCode: string;
  bedNumber: string | null;
  wardName: string | null;
  doctorName: string | null;
  open: boolean;
  vitals: VitalsView[];
  orders: OrderView[];
  doses: DoseView[];
  notes: NoteView[];
}

export interface RoundItem {
  admissionId: string;
  patientName: string;
  patientCode: string;
  bedNumber: string | null;
  wardId: string | null;
  wardName: string | null;
  doctorName: string | null;
  dosesDue: number;
  dosesOverdue: number;
  nextDoseAt: string | null;
  lastVitalsAt: string | null;
  vitalsOverdue: boolean;
  flags: string[];
  dischargeAdvised: boolean;
}

/** Colour of a dose time by what happened, or how urgent it is. */
export const SLOT_STYLE: Record<SlotState, string> = {
  GIVEN: 'bg-emerald-600 text-white border-emerald-600',
  HELD: 'bg-amber-100 text-amber-900 border-amber-400',
  REFUSED: 'bg-amber-100 text-amber-900 border-amber-400',
  MISSED: 'bg-slate-200 text-slate-700 border-slate-400',
  DUE: 'bg-blue-600 text-white border-blue-600',
  OVERDUE: 'bg-red-600 text-white border-red-600',
  UPCOMING: 'bg-white text-slate-700 border-outline-variant',
};
