import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuditLog } from '../../../../core/models/audit-log.model';
import { PagedResponse } from '../../../../core/models/common.model';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-audit-log-viewer',
  templateUrl: './audit-log-viewer.html',
  standalone: true,
  imports: [FormsModule, DatePipe, PaginatorComponent, EmptyStateComponent],
})
export class AuditLogViewerComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  logs: AuditLog[] = [];
  isLoading = false;
  error = '';
  totalElements = 0;
  currentPage = 0;
  pageSize = 20;

  filterEntity = '';
  filterAction = '';
  filterDateFrom = '';
  filterDateTo = '';

  selectedLog: AuditLog | null = null;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = '';
    this.auditLogService
      .getAuditLogs({
        page: this.currentPage,
        size: this.pageSize,
        entity: this.filterEntity || undefined,
        action: this.filterAction || undefined,
        startDate: this.filterDateFrom || undefined,
        endDate: this.filterDateTo || undefined,
      })
      .subscribe({
        next: (res: PagedResponse<AuditLog>) => {
          this.logs = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load audit logs';
          this.isLoading = false;
        },
      });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterEntity = '';
    this.filterAction = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 0;
    this.loadLogs();
  }

  onPageChange(event: { page: number; size: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.size;
    this.loadLogs();
  }

  openDetail(log: AuditLog): void {
    this.selectedLog = log;
  }

  closeDetail(): void {
    this.selectedLog = null;
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE': return 'bg-green-50 text-status-green';
      case 'UPDATE': return 'bg-blue-50 text-medical-blue';
      case 'DELETE': return 'bg-red-50 text-status-red';
      case 'STATUS_CHANGE': return 'bg-amber-50 text-amber-600';
      case 'LOGIN': return 'bg-purple-50 text-purple-600';
      case 'LOGOUT': return 'bg-gray-100 text-outline';
      default: return 'bg-gray-50 text-outline';
    }
  }

  formatJson(value: string | null): string {
    if (!value) return '—';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
}
