export interface CreateHealthPackageRequest {
  packageName: string;
  description?: string;
  actualPriceInPaisa: number;
  offerPriceInPaisa: number;
  testsIncluded?: string;
}

export interface UpdateHealthPackageRequest {
  packageName?: string;
  description?: string;
  actualPriceInPaisa?: number;
  offerPriceInPaisa?: number;
  testsIncluded?: string;
}

export interface HealthPackageResponse {
  id: string;
  packageName: string;
  description: string;
  actualPriceInPaisa: number;
  offerPriceInPaisa: number;
  testsIncluded: string;
  isActive: boolean;
  createdAt: string;
}

export interface BookHealthPackageRequest {
  patientName: string;
  email: string;
  phone: string;
  bookingDate: string;
}

export interface HealthPackageBookingResponse {
  id: string;
  packageId: string;
  packageName: string;
  patientName: string;
  email: string;
  phone: string;
  bookingDate: string;
  status: string;
  createdAt: string;
}
