import { Component, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../core/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ReportStore } from '../../store/report.store';

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.html',
  standalone: true,
  imports: [FormsModule],
})
export class ReportsDashboard implements OnInit {
  readonly store = inject(ReportStore);
  private reportService = inject(ReportService);
  private toastService = inject(ToastService);
  private auth = inject(AuthService);

  readonly maxAppointmentCount = computed(() => {
    const trends = this.store.appointmentTrends();
    if (!trends.length) return 1;
    return Math.max(...trends.map((t) => t.count), 1);
  });

  readonly maxRevenueHeight = computed(() => {
    const report = this.store.revenueReport();
    if (!report?.monthlyBreakdown?.length) return 0;
    return Math.max(
      ...report.monthlyBreakdown.map((m) => Math.max(m.billed, m.collected)),
      1,
    );
  });

  readonly maxDoctorRevenue = computed(() => {
    const docs = this.store.doctorPerformance();
    if (!docs.length) return 0;
    return Math.max(...docs.map((d) => d.revenueInPaisa));
  });

  /** Revenue, bills and per-doctor billing need FINANCE_REPORTS; operations reports do not. */
  get finance(): boolean {
    return this.auth.can('FINANCE_REPORTS');
  }

  ngOnInit(): void {
    this.store.loadAll(this.finance);
  }

  refresh(): void {
    this.store.loadAll(this.finance);
  }

  formatPaisa(paisa: number | null | undefined): string {
    if (!paisa) return '₹0';
    return '₹' + (paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  donutDash(count: number, total: number): string {
    const circumference = 2 * Math.PI * 52;
    const ratio = total > 0 ? count / total : 0;
    const visible = ratio * circumference;
    return `${visible} ${circumference - visible}`;
  }

  donutOffset(count: number, total: number, beforeCount: number): number {
    const circumference = 2 * Math.PI * 52;
    const beforeRatio = total > 0 ? beforeCount / total : 0;
    return -beforeRatio * circumference;
  }

  exportAsCsv(): void {
    const rows: string[][] = [];
    const s = this.store;
    const dash = s.dashboardStats();
    const bills = s.billsStatus();

    if (dash) {
      rows.push(['Metric', 'Value']);
      rows.push(['Total Patients', String(dash.totalPatients)]);
      rows.push(['Today Appointments', String(dash.todayAppointments)]);
      rows.push(['Pending Bills', String(dash.pendingBills)]);
      rows.push(['Total Revenue', this.formatPaisa(dash.totalRevenueInPaisa)]);
      rows.push(['Active Doctors', String(dash.activeDoctors)]);
    }

    if (s.doctorPerformance().length) {
      rows.push([]);
      rows.push(['Doctor', 'Consultations', 'Revenue']);
      for (const d of s.doctorPerformance()) {
        rows.push([d.doctorName, String(d.consultationCount), this.formatPaisa(d.revenueInPaisa)]);
      }
    }

    if (bills) {
      rows.push([]);
      rows.push(['Bills Status']);
      rows.push(['Paid', String(bills.paidCount)]);
      rows.push(['Unpaid', String(bills.unpaidCount)]);
      rows.push(['Partially Paid', String(bills.partiallyPaidCount)]);
      rows.push(['Voided', String(bills.voidedCount)]);
    }

    const csvContent = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cliniva-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('CSV report exported');
  }

  exportAsPdf(): void {
    this.toastService.info('Generating PDF report...');
    this.reportService.exportReportPdf().subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cliniva-report-${new Date().toISOString().split('T')[0]}.pdf`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.toastService.success('PDF report exported');
      },
      error: () => {
        this.toastService.error('Failed to export PDF report');
      },
    });
  }
}

/**
 * One CSV cell: quoted when it holds a comma, quote or line break (amounts like "₹1,250.00" do), and never read as a
 * formula by a spreadsheet: text starting with = + - @ gets a leading apostrophe.
 */
export function csvCell(value: string): string {
  let s = value ?? '';
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
