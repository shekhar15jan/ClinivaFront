import { Component, OnInit, inject } from '@angular/core';
import { HealthPackageService } from '../../../core/services/health-package.service';
import { HealthPackageResponse } from '../../../core/models/health-package.model';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.html',
  styleUrl: './package-list.scss',
  standalone: true,
  imports: [SharedModule],
})
export class PackageList implements OnInit {
  private packageService = inject(HealthPackageService);

  packages: HealthPackageResponse[] = [];
  isLoading = false;
  error = '';

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

  toggleActive(pkg: HealthPackageResponse) {
    this.packageService.toggleActive(pkg.id).subscribe({
      next: () => this.loadPackages(),
      error: (err) => console.error('Failed to toggle package:', err),
    });
  }

  getPrice(amountInPaisa: number): string {
    return '₹' + (amountInPaisa / 100).toFixed(2);
  }
}
