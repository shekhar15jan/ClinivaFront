export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  unit: string;
  priceInPaisa: number;
  stockQuantity?: number;
  isActive: boolean;
  createdAt: string;
}
