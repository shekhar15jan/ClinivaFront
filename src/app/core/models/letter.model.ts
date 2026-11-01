export type LetterType = 'MEDICAL_CERTIFICATE' | 'FITNESS_CERTIFICATE' | 'REFERRAL';

export interface Letter {
  id: string;
  type: LetterType;
  number: string;
  fromDate?: string;
  toDate?: string;
  referredTo?: string;
  purpose?: string;
  remarks?: string;
  issuedAt: string;
}

export interface IssueLetterRequest {
  type: LetterType;
  fromDate?: string;
  toDate?: string;
  referredTo?: string;
  purpose?: string;
  remarks?: string;
}

export const LETTER_TITLES: Record<LetterType, string> = {
  MEDICAL_CERTIFICATE: 'Medical certificate',
  FITNESS_CERTIFICATE: 'Fitness certificate',
  REFERRAL: 'Referral letter',
};
