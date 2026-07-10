import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { OnboardingWizard } from './pages/onboarding/onboarding-wizard';

const routes: Routes = [{ path: '', component: OnboardingWizard }];

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), OnboardingWizard],
})
export class OnboardingModule {}
