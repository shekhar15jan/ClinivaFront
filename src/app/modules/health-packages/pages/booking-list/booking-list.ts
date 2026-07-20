import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HealthPackageService } from '../../../../core/services/health-package.service';
import { HealthPackageBookingResponse } from '../../../../core/models/health-package.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.html',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
})
export class BookingList implements OnInit {
  private packageService = inject(HealthPackageService);

  bookings: HealthPackageBookingResponse[] = [];
  isLoading = false;
  error = '';
  processingId: string | null = null;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = '';
    this.packageService.listBookings().subscribe({
      next: (res) => {
        this.bookings = res.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load bookings';
        this.isLoading = false;
      },
    });
  }

  approveBooking(id: string): void {
    this.processingId = id;
    this.packageService.approveBooking(id).subscribe({
      next: () => {
        this.processingId = null;
        this.loadBookings();
      },
      error: () => {
        this.processingId = null;
        this.error = 'Failed to approve booking';
      },
    });
  }

  rejectBooking(id: string): void {
    this.processingId = id;
    this.packageService.rejectBooking(id).subscribe({
      next: () => {
        this.processingId = null;
        this.loadBookings();
      },
      error: () => {
        this.processingId = null;
        this.error = 'Failed to reject booking';
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'APPROVED': return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
