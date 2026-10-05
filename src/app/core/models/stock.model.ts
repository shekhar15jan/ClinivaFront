/** Pharmacy stock: batches, movements, alerts and issues to inpatients. Money in paisa. */

export type MovementKind = 'RECEIPT' | 'SALE' | 'ISSUE' | 'RETURN' | 'EXPIRED' | 'ADJUST';

export interface StockLine {
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  unit: string | null;
  priceInPaisa: number;
  onHand: number;
  reorderLevel: number;
  low: boolean;
  nearestExpiry: string | null;
  expiredQuantity: number;
  unbatched: number;
}

export interface BatchView {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  quantityLeft: number;
  costInPaisa: number;
  mrpInPaisa: number | null;
  supplierName: string | null;
  invoiceNumber: string | null;
  receivedAt: string;
  expired: boolean;
}

export interface MovementView {
  id: string;
  kind: MovementKind;
  quantity: number;
  batchNumber: string | null;
  admissionNumber: string | null;
  patientName: string | null;
  note: string | null;
  by: string | null;
  at: string;
}

export interface MedicineStock {
  line: StockLine;
  batches: BatchView[];
  movements: MovementView[];
}

export interface ExpiryAlert {
  batchId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantityLeft: number;
  valueInPaisa: number;
  expired: boolean;
}

export interface Alerts {
  low: StockLine[];
  expiring: ExpiryAlert[];
  expired: ExpiryAlert[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
}

export interface ReceiptLine {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costInPaisa: number;
  mrpInPaisa?: number | null;
}

export interface IssueView {
  chargeId: string;
  medicineId: string;
  medicineName: string;
  issued: number;
  returned: number;
  unitPriceInPaisa: number;
  issuedAt: string;
  issuedBy: string | null;
}

export const MOVEMENT_LABEL: Record<MovementKind, string> = {
  RECEIPT: 'Received',
  SALE: 'Sold (OPD)',
  ISSUE: 'Issued to ward',
  RETURN: 'Returned',
  EXPIRED: 'Written off',
  ADJUST: 'Count',
};
