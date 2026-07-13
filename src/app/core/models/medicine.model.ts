export interface Medicine {
  id: string;
  medicineName: string;
  genericName: string;
  manufacturer: string;
  category: string;
  unit: string;
  priceInPaisa: number;
  quantity: number;
  stockStatus?: string;
  isDiscontinued: boolean;
  createdAt?: string;
  updatedAt?: string;
}
