/** The insurance desk: payers, policies and cashless claims. Money in paisa. */

export type PayerKind = 'INSURER' | 'TPA' | 'SCHEME';
export type ClaimStatus =
  | 'DRAFT'
  | 'PREAUTH_SUBMITTED'
  | 'PREAUTH_APPROVED'
  | 'PREAUTH_REJECTED'
  | 'CLAIM_SUBMITTED'
  | 'SETTLED'
  | 'CLAIM_REJECTED'
  | 'CANCELLED';
export type Step = 'SUBMIT_PREAUTH' | 'APPROVE' | 'ENHANCE' | 'REJECT_PREAUTH' | 'SUBMIT_CLAIM' | 'SETTLE' | 'REJECT_CLAIM' | 'CANCEL' | 'QUERY' | 'NOTE';

export interface Payer {
  id: string;
  name: string;
  kind: PayerKind;
  code: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface Policy {
  id: string;
  patientId: string;
  payerId: string;
  payerName: string;
  payerKind: PayerKind;
  tpaId: string | null;
  tpaName: string | null;
  policyNumber: string;
  memberId: string | null;
  holderName: string | null;
  relation: string | null;
  validFrom: string | null;
  validTo: string | null;
  sumInsuredInPaisa: number | null;
  active: boolean;
}

export interface PolicyRequest {
  patientId: string;
  payerId: string;
  tpaId: string | null;
  policyNumber: string;
  memberId: string | null;
  validFrom: string | null;
  validTo: string | null;
  sumInsuredInPaisa: number | null;
}

export interface ClaimEvent {
  kind: string;
  amountInPaisa: number | null;
  note: string | null;
  by: string | null;
  at: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  admissionId: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  policyId: string;
  policyNumber: string;
  memberId: string | null;
  payerName: string;
  payerKind: PayerKind;
  tpaName: string | null;
  payerReference: string | null;
  packageCode: string | null;
  packageName: string | null;
  requestedInPaisa: number | null;
  approvedInPaisa: number | null;
  claimedInPaisa: number | null;
  settledInPaisa: number | null;
  tdsInPaisa: number | null;
  deductionInPaisa: number | null;
  expectedInPaisa: number;
  billTotalInPaisa: number | null;
  billNumber: string | null;
  discharged: boolean;
  createdAt: string;
  events: ClaimEvent[];
}

export interface ClaimSummary {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  patientName: string;
  payerName: string;
  admissionNumber: string;
  expectedInPaisa: number;
  settledInPaisa: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Receivables {
  expectedInPaisa: number;
  claims: number;
  byAge: ClaimSummary[];
}

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  DRAFT: 'Draft',
  PREAUTH_SUBMITTED: 'Pre-auth sent',
  PREAUTH_APPROVED: 'Pre-auth approved',
  PREAUTH_REJECTED: 'Pre-auth rejected',
  CLAIM_SUBMITTED: 'Claim sent',
  SETTLED: 'Settled',
  CLAIM_REJECTED: 'Claim rejected',
  CANCELLED: 'Cancelled',
};

export const CLAIM_STATUS_STYLE: Record<ClaimStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PREAUTH_SUBMITTED: 'bg-amber-100 text-amber-900',
  PREAUTH_APPROVED: 'bg-blue-100 text-blue-800',
  PREAUTH_REJECTED: 'bg-red-100 text-red-800',
  CLAIM_SUBMITTED: 'bg-violet-100 text-violet-800',
  SETTLED: 'bg-emerald-100 text-emerald-800',
  CLAIM_REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

/** The steps the desk can take from each status, in the order offered. */
export const NEXT_STEPS: Record<ClaimStatus, Step[]> = {
  DRAFT: ['SUBMIT_PREAUTH', 'CANCEL', 'NOTE'],
  PREAUTH_SUBMITTED: ['APPROVE', 'REJECT_PREAUTH', 'QUERY', 'CANCEL', 'NOTE'],
  PREAUTH_APPROVED: ['SUBMIT_CLAIM', 'ENHANCE', 'QUERY', 'CANCEL', 'NOTE'],
  PREAUTH_REJECTED: ['NOTE'],
  CLAIM_SUBMITTED: ['SETTLE', 'REJECT_CLAIM', 'QUERY', 'NOTE'],
  SETTLED: ['NOTE'],
  CLAIM_REJECTED: ['NOTE'],
  CANCELLED: ['NOTE'],
};

export const STEP_LABEL: Record<Step, string> = {
  SUBMIT_PREAUTH: 'Pre-auth sent',
  APPROVE: 'Approved',
  ENHANCE: 'Enhancement approved',
  REJECT_PREAUTH: 'Pre-auth rejected',
  SUBMIT_CLAIM: 'Claim sent',
  SETTLE: 'Payment received',
  REJECT_CLAIM: 'Claim rejected',
  CANCEL: 'Cancel claim',
  QUERY: 'Query from insurer',
  NOTE: 'Note',
};

/** Which steps need an amount, and what it is. */
export const STEP_AMOUNT: Partial<Record<Step, string>> = {
  SUBMIT_PREAUTH: 'Amount asked for',
  APPROVE: 'Amount approved',
  ENHANCE: 'New approved amount',
  SUBMIT_CLAIM: 'Amount claimed',
  SETTLE: 'Amount received',
};
