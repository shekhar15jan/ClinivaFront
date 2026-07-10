import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast.component';
import { PaginatorComponent } from './components/paginator/paginator.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ResourceUsageBarComponent } from './components/resource-usage-bar/resource-usage-bar.component';
import { ModuleUpgradePromptComponent } from './components/module-upgrade-prompt/module-upgrade-prompt.component';
import { CsvUploadComponent } from './components/csv-upload/csv-upload.component';
import { TrialBannerComponent } from './components/trial-banner/trial-banner.component';

const COMPONENTS = [
  ToastComponent,
  PaginatorComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  ConfirmDialogComponent,
  EmptyStateComponent,
  ResourceUsageBarComponent,
  ModuleUpgradePromptComponent,
  CsvUploadComponent,
  TrialBannerComponent,
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ...COMPONENTS
  ],
  exports: [
    CommonModule,
    ...COMPONENTS
  ]
})
export class SharedModule {}
