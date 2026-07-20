import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClinicSettings } from '../../../../core/models/setting.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clinic-settings',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-[#1E293B] mb-6">Clinic Settings</h1>

      <div class="max-w-3xl space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-[#1E293B] mb-4">General Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="col-span-2">
              <label for="settingsClinicName" class="block text-sm font-medium text-[#475569] mb-1">Clinic Name</label>
              <input
                id="settingsClinicName"
                type="text"
                [(ngModel)]="settings.clinicName"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div class="col-span-2">
              <label for="settingsAddress" class="block text-sm font-medium text-[#475569] mb-1">Address</label>
              <textarea
                id="settingsAddress"
                [(ngModel)]="settings.address"
                rows="2"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              ></textarea>
            </div>
            <div>
              <label for="settingsPhone" class="block text-sm font-medium text-[#475569] mb-1">Phone</label>
              <input
                id="settingsPhone"
                type="tel"
                [(ngModel)]="settings.phone"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label for="settingsEmail" class="block text-sm font-medium text-[#475569] mb-1">Email</label>
              <input
                id="settingsEmail"
                type="email"
                [(ngModel)]="settings.email"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-[#1E293B] mb-4">Configuration</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="settingsPatientIdPrefix" class="block text-sm font-medium text-[#475569] mb-1">Patient ID Prefix</label>
              <input
                id="settingsPatientIdPrefix"
                type="text"
                [(ngModel)]="settings.patientIdPrefix"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label for="settingsDefaultFee" class="block text-sm font-medium text-[#475569] mb-1"
                >Default Consultation Fee (₹)</label
              >
              <input
                id="settingsDefaultFee"
                type="number"
                [(ngModel)]="defaultFee"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label for="settingsCurrency" class="block text-sm font-medium text-[#475569] mb-1">Currency</label>
              <select
                id="settingsCurrency"
                [(ngModel)]="settings.currency"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label for="settingsTimezone" class="block text-sm font-medium text-[#475569] mb-1">Timezone</label>
              <select
                id="settingsTimezone"
                [(ngModel)]="settings.timezone"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-[#1E293B] mb-4">Features</h2>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.enableOnlinePayment"
                class="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-[#0052CC]"
              />
              <span class="text-sm text-[#475569]">Enable Online Payment (Razorpay)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.enableOtpLogin"
                class="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-[#0052CC]"
              />
              <span class="text-sm text-[#475569]">Enable OTP-based Login</span>
            </label>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            class="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b]"
          >
            Save Settings
          </button>
          <button class="text-[#64748B] hover:text-[#1E293B] text-sm font-medium px-4 py-2">
            Reset to Default
          </button>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-[#1E293B] mb-4">Advanced</h2>
          <div class="space-y-3">
            <button
              (click)="router.navigate(['email-templates'], { relativeTo: activatedRoute })"
              class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors text-left"
            >
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[#0052CC]">mail</span>
                <div>
                  <p class="text-sm font-medium text-[#1E293B]">Email Templates</p>
                  <p class="text-xs text-[#64748B]">Customize notification emails sent to patients</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-[#94A3B8]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [FormsModule],
})
export class ClinicSettingsPage {
  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
  ) {}
  settings: ClinicSettings = {
    clinicName: 'Cliniva Hospital',
    address: '123 Healthcare Avenue, Medical District',
    phone: '+91 9876543210',
    email: 'admin@cliniva.com',
    patientIdPrefix: 'CLI',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultConsultationFeeInPaisa: 50000,
    enableOnlinePayment: true,
    enableOtpLogin: true,
  };

  defaultFee = 500;

}
