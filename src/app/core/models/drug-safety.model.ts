export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface Allergy {
  id: string;
  substance: string;
  severity: AllergySeverity;
  reaction?: string;
  recordedAt: string;
}

/** One drug warning. A blocking one stops the prescription from being saved unless the doctor acknowledges it with a reason. */
export interface SafetyWarning {
  type: 'ALLERGY' | 'INTERACTION' | 'DUPLICATE';
  severity: string;
  medicine: string;
  other?: string;
  message: string;
  blocking: boolean;
}
