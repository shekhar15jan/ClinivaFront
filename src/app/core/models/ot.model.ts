/** The operation theatre: theatres, bookings, the safety checklist and the operation note. Money in paisa. */

export type SurgeryStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SurgeryPriority = 'ELECTIVE' | 'EMERGENCY';
export type Side = 'LEFT' | 'RIGHT' | 'BOTH' | 'NA';
export type Anaesthesia = 'GENERAL' | 'SPINAL' | 'EPIDURAL' | 'REGIONAL' | 'LOCAL' | 'SEDATION';

export const ANAESTHESIA: { value: Anaesthesia; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SPINAL', label: 'Spinal' },
  { value: 'EPIDURAL', label: 'Epidural' },
  { value: 'REGIONAL', label: 'Regional block' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'SEDATION', label: 'Sedation' },
];

export const SIDES: { value: Side; label: string }[] = [
  { value: 'NA', label: 'Not sided' },
  { value: 'LEFT', label: 'Left' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'BOTH', label: 'Both' },
];

export interface TheatreView {
  id: string;
  name: string;
  active: boolean;
}

export interface Step {
  at: string;
  by: string | null;
}

export interface BoardItem {
  id: string;
  surgeryNumber: string;
  status: SurgeryStatus;
  priority: SurgeryPriority;
  theatreId: string;
  patientName: string;
  patientCode: string;
  inpatient: boolean;
  surgeonName: string | null;
  procedureName: string;
  side: Side | null;
  scheduledStart: string;
  expectedMinutes: number;
  step: string;
}

export interface Board {
  theatres: TheatreView[];
  surgeries: BoardItem[];
}

export interface BookRequest {
  patientId: string;
  admissionId: string | null;
  theatreId: string;
  surgeonId: string;
  anaesthetistId: string | null;
  assistants: string | null;
  procedureName: string;
  side: Side;
  anaesthesiaType: Anaesthesia;
  priority: SurgeryPriority;
  scheduledStart: string;
  expectedMinutes: number;
  surgeonFeeInPaisa: number;
  anaesthesiaFeeInPaisa: number;
  theatreFeeInPaisa: number;
}

export interface NoteRequest {
  findings: string | null;
  procedureDone: string;
  complications: string | null;
  bloodLossMl: number | null;
  implants: string | null;
  postOpOrders: string | null;
}

export interface SurgeryView {
  id: string;
  surgeryNumber: string;
  status: SurgeryStatus;
  priority: SurgeryPriority;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientAge: number | null;
  patientGender: string | null;
  admissionId: string | null;
  admissionNumber: string | null;
  theatreId: string;
  theatreName: string | null;
  surgeonId: string;
  surgeonName: string | null;
  anaesthetistId: string | null;
  anaesthetistName: string | null;
  assistants: string | null;
  procedureName: string;
  side: Side | null;
  anaesthesiaType: Anaesthesia;
  scheduledStart: string;
  expectedMinutes: number;
  startedAt: string | null;
  endedAt: string | null;
  consent: Step | null;
  signIn: Step | null;
  timeOut: Step | null;
  signOut: Step | null;
  /** Whether the operation note is shown to this user. */
  notes: boolean;
  findings: string | null;
  procedureDone: string | null;
  complications: string | null;
  bloodLossMl: number | null;
  implants: string | null;
  postOpOrders: string | null;
  noteBy: string | null;
  surgeonFeeInPaisa: number;
  anaesthesiaFeeInPaisa: number;
  theatreFeeInPaisa: number;
  chargesPosted: boolean;
  billId: string | null;
  billNumber: string | null;
  cancelReason: string | null;
}

export const SURGERY_STATUS_LABEL: Record<SurgeryStatus, string> = {
  SCHEDULED: 'Booked',
  IN_PROGRESS: 'In surgery',
  COMPLETED: 'Over',
  CANCELLED: 'Cancelled',
};
