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
