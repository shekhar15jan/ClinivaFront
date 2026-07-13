export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingBills: number;
  totalRevenueInPaisa: number;
  activeDoctors: number;
}

export interface AppointmentTrend {
  month: string;
  count: number;
}

export interface RevenueReport {
  totalBilledInPaisa: number;
  totalCollectedInPaisa: number;
  outstandingInPaisa: number;
  monthlyBreakdown: { month: string; billed: number; collected: number }[];
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  consultationCount: number;
  revenueInPaisa: number;
}

export interface BillsStatusReport {
  totalBills: number;
  unpaidCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  voidedCount: number;
  totalAmountInPaisa: number;
  paidAmountInPaisa: number;
  unpaidAmountInPaisa: number;
  monthlyBreakdown: { month: string; billed: number; collected: number }[];
}

export interface MonthlyBreakdown {
  month: string;
  billed: number;
  collected: number;
}
