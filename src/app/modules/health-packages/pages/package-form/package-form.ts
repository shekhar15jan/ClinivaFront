import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HealthPackageService } from '../../../../core/services/health-package.service';
import { HealthPackageResponse, CreateHealthPackageRequest, UpdateHealthPackageRequest } from '../../../../core/models/health-package.model';

@Component({
  selector: 'app-package-form',
  templateUrl: './package-form.html',
  standalone: true,
  imports: [FormsModule],
})
export class PackageForm implements OnInit {
  private packageService = inject(HealthPackageService);

  @Input() package?: HealthPackageResponse;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: CreateHealthPackageRequest = {
    packageName: '',
    description: '',
    actualPriceInPaisa: 0,
    offerPriceInPaisa: 0,
    testsIncluded: '',
  };

  isSubmitting = false;
  error = '';
  isEdit = false;

  ngOnInit(): void {
    if (this.package) {
      this.isEdit = true;
      this.form = {
        packageName: this.package.packageName,
        description: this.package.description,
        actualPriceInPaisa: this.package.actualPriceInPaisa,
        offerPriceInPaisa: this.package.offerPriceInPaisa,
        testsIncluded: this.package.testsIncluded,
      };
    }
  }

  submit(): void {
    if (!this.form.packageName || this.form.actualPriceInPaisa <= 0 || this.form.offerPriceInPaisa <= 0) {
      this.error = 'Package name and valid prices are required';
      return;
    }
    this.isSubmitting = true;
    this.error = '';

    const request$ = this.isEdit && this.package
      ? this.packageService.update(this.package.id, this.form as UpdateHealthPackageRequest)
      : this.packageService.create(this.form);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.saved.emit();
        } else {
          this.error = 'Failed to save package';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error = err?.message || 'Error saving package';
        this.isSubmitting = false;
      },
    });
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
