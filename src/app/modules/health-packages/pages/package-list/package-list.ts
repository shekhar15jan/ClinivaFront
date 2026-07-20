import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthPackageService } from '../../../../core/services/health-package.service';
import { HealthPackageResponse, BookHealthPackageRequest } from '../../../../core/models/health-package.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PackageForm } from '../package-form/package-form';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.html',
  styleUrl: './package-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, PackageForm, FormsModule, RouterLink],
})
export class PackageList implements OnInit {
  private packageService = inject(HealthPackageService);

  packages: HealthPackageResponse[] = [];
  isLoading = false;
  error = '';

  selectedPackage: HealthPackageResponse | null = null;
  bookingForm: BookHealthPackageRequest = { patientName: '', email: '', phone: '', bookingDate: '' };
  isBooking = false;
  bookingError = '';

  showForm = false;
  editingPackage: HealthPackageResponse | undefined;

  ngOnInit() {
    this.loadPackages();
  }

  loadPackages() {
    this.isLoading = true;
    this.error = '';
    this.packageService.list().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.packages = res.data.content || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load health packages';
        this.isLoading = false;
      },
    });
  }

  openCreateForm(): void {
    this.editingPackage = undefined;
    this.showForm = true;
  }

  openEditForm(pkg: HealthPackageResponse): void {
    this.editingPackage = pkg;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPackage = undefined;
  }

  onSaved(): void {
    this.closeForm();
    this.loadPackages();
  }

  toggleActive(pkg: HealthPackageResponse) {
    this.packageService.toggleActive(pkg.id).subscribe({
      next: () => this.loadPackages(),
      error: (err) => console.error('Failed to toggle package:', err),
    });
  }

  openBooking(pkg: HealthPackageResponse) {
    this.selectedPackage = pkg;
    this.bookingForm = {
      patientName: '',
      email: '',
      phone: '',
      bookingDate: new Date().toISOString().split('T')[0],
    };
    this.bookingError = '';
  }

  closeBooking() {
    this.selectedPackage = null;
  }

  submitBooking() {
    if (!this.selectedPackage || !this.bookingForm.patientName || !this.bookingForm.email) return;
    this.isBooking = true;
    this.bookingError = '';
    this.packageService.book(this.selectedPackage.id, this.bookingForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedPackage = null;
          this.loadPackages();
        } else {
          this.bookingError = 'Booking failed. Please try again.';
        }
        this.isBooking = false;
      },
      error: (err) => {
        this.bookingError = err?.message || 'Booking error';
        this.isBooking = false;
      },
    });
  }

  getPrice(amountInPaisa: number): string {
    return '₹' + (amountInPaisa / 100).toFixed(2);
  }
}
