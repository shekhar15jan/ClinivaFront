export type ConsentFormType = 'PROCEDURE' | 'ANAESTHESIA' | 'ADMISSION';
export type ConsentFormStatus = 'DRAFT' | 'SIGNED' | 'REFUSED';
export type ConsentMethod = 'PAPER' | 'IN_PERSON';

export interface ConsentForm {
  id: string;
  type: ConsentFormType;
  number: string;
  title: string;
  procedure?: string;
  risksExplained?: string;
  status: ConsentFormStatus;
  signerName?: string;
  signerRelation?: string;
  witnessName?: string;
  method?: ConsentMethod;
  decidedAt?: string;
  createdAt: string;
}

export interface CreateConsentFormRequest {
  type: ConsentFormType;
  procedure?: string;
  risksExplained?: string;
}

export interface SignConsentFormRequest {
  signerName: string;
  signerRelation?: string;
  signerIsPatient: boolean;
  witnessName?: string;
  method: ConsentMethod;
}
