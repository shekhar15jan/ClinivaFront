import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClinicSettings } from '../../../../core/models/setting.model';
import { SettingService } from '../../../../core/services/setting.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { mediaUrl } from '../../../../core/utils/media-url';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-clinic-settings',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-[#1E293B] mb-6">Clinic Settings</h1>

      @if (error) {
        <div class="max-w-3xl mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-700" id="settings-error">
          {{ error }}
          <button type="button" class="underline ml-2" (click)="load()">Retry</button>
        </div>
      }

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

        <div class="bg-white rounded-xl border border-gray-200 p-6" id="settings-branding">
          <h2 class="text-lg font-bold text-[#1E293B] mb-1">Branding</h2>
          <p class="text-xs text-[#64748B] mb-4">Your logo appears in the app and on printed documents. PNG, JPEG or WebP, up to 512 KB.</p>
          <div class="flex items-center gap-4 flex-wrap">
            <div class="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              @if (logoSrc) {
                <img [src]="logoSrc" alt="Clinic logo" id="settings-logo-preview" class="max-w-full max-h-full object-contain" />
              } @else {
                <span class="material-symbols-outlined text-[#94A3B8]">image</span>
              }
            </div>
            <label class="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              {{ isUploading ? 'Uploading...' : logoSrc ? 'Change logo' : 'Upload logo' }}
              <input type="file" id="settings-logo-file" accept="image/png,image/jpeg,image/webp" class="hidden"
                     [disabled]="isUploading" (change)="onLogoSelected($event)" />
            </label>
            @if (logoSrc) {
              <button type="button" id="settings-logo-remove" (click)="removeLogo()" [disabled]="isUploading"
                      class="text-sm text-red-600 hover:underline disabled:opacity-50">Remove</button>
            }
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6" id="settings-billing">
          <h2 class="text-lg font-bold text-[#1E293B] mb-4">Billing &amp; Payments</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="settingsTaxRate" class="block text-sm font-medium text-[#475569] mb-1">GST on bills (%)</label>
              <input id="settingsTaxRate" type="number" min="0" max="100" step="0.01"
                     [(ngModel)]="settings.taxRatePercent" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
              <p class="text-xs text-[#64748B] mt-1">Added to new bills. Use 0 if your services are exempt.</p>
            </div>
            <div>
              <label for="settingsUpiId" class="block text-sm font-medium text-[#475569] mb-1">Clinic UPI ID</label>
              <input id="settingsUpiId" type="text" placeholder="yourclinic@okhdfcbank"
                     [(ngModel)]="settings.upiPayeeId" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
              <p class="text-xs text-[#64748B] mt-1">Patients' UPI QR payments go to this ID. Leave empty to not offer UPI QR.</p>
            </div>
            <div class="sm:col-span-2">
              <label for="settingsSenderName" class="block text-sm font-medium text-[#475569] mb-1">Email sender name</label>
              <input id="settingsSenderName" type="text" maxlength="100" [placeholder]="settings.clinicName || 'Your clinic'"
                     [(ngModel)]="settings.emailSenderName" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
              <p class="text-xs text-[#64748B] mt-1">Shown as the sender of emails to patients; replies go to the clinic email above.</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6" id="settings-razorpay">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-lg font-bold text-[#1E293B]">Online payments (Razorpay)</h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                  [class]="razorpayReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
              {{ razorpayReady ? 'Connected' : 'Not set up' }}
            </span>
          </div>
          <p class="text-sm text-[#64748B] mb-4">
            Patients pay by card, UPI or net banking into your clinic's own Razorpay account. Find the keys in the
            Razorpay Dashboard under Account &amp; Settings &rarr; API Keys.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="settingsRzpKeyId" class="block text-sm font-medium text-[#475569] mb-1">Key ID</label>
              <input id="settingsRzpKeyId" type="text" placeholder="rzp_live_..." autocomplete="off"
                     [(ngModel)]="settings.razorpayKeyId" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#0052CC]" />
            </div>
            <div>
              <label for="settingsRzpSecret" class="block text-sm font-medium text-[#475569] mb-1">Key secret</label>
              <input id="settingsRzpSecret" type="password" autocomplete="new-password"
                     [placeholder]="settings.razorpayKeySecretSet ? 'Saved (leave empty to keep)' : 'Paste the key secret'"
                     [(ngModel)]="razorpaySecret" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
            </div>
            <div class="sm:col-span-2">
              <label for="settingsRzpWebhookUrl" class="block text-sm font-medium text-[#475569] mb-1">Webhook URL</label>
              <div class="flex gap-2">
                <input id="settingsRzpWebhookUrl" type="text" readonly [value]="webhookUrl"
                       class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 text-[#475569]" />
                <button type="button" (click)="copyWebhookUrl()" [disabled]="!webhookUrl"
                        class="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Copy</button>
              </div>
              <p class="text-xs text-[#64748B] mt-1">
                In Razorpay: Account &amp; Settings &rarr; Webhooks &rarr; Add, paste this URL, choose a secret, and tick
                payment.captured and payment.failed. Bills are then marked paid even if a patient closes the page early.
              </p>
            </div>
            <div>
              <label for="settingsRzpWebhookSecret" class="block text-sm font-medium text-[#475569] mb-1">Webhook secret</label>
              <input id="settingsRzpWebhookSecret" type="password" autocomplete="new-password"
                     [placeholder]="settings.razorpayWebhookSecretSet ? 'Saved (leave empty to keep)' : 'The secret you chose in Razorpay'"
                     [(ngModel)]="razorpayWebhookSecret" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
            </div>
            @if (settings.razorpayKeySecretSet) {
              <div class="flex items-end">
                <button type="button" id="settings-rzp-remove" (click)="removeRazorpay()"
                        class="text-sm text-red-600 hover:underline">Disconnect Razorpay</button>
              </div>
            }
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
            id="save-settings"
            type="button"
            (click)="save()"
            [disabled]="isSaving || isLoading"
            class="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
          <button
            type="button"
            (click)="load()"
            [disabled]="isSaving || isLoading"
            class="text-[#64748B] hover:text-[#1E293B] text-sm font-medium px-4 py-2 disabled:opacity-50"
          >
            Discard Changes
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
export class ClinicSettingsPage implements OnInit {
  public router = inject(Router);
  public activatedRoute = inject(ActivatedRoute);
  private settingService = inject(SettingService);
  private toast = inject(ToastService);

  // Placeholders shown for a moment before the clinic's own settings arrive.
  settings: ClinicSettings = {
    clinicName: '',
    address: '',
    phone: '',
    email: '',
    patientIdPrefix: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultConsultationFeeInPaisa: 0,
    enableOnlinePayment: false,
    enableOtpLogin: false,
    taxRatePercent: 0,
    upiPayeeId: '',
    emailSenderName: '',
    logoUrl: null,
  };

  isUploading = false;

  /** Typed secrets; empty means "keep what is saved". Never filled from the server. */
  razorpaySecret = '';
  razorpayWebhookSecret = '';

  get razorpayReady(): boolean {
    return !!this.settings.razorpayKeyId && !!this.settings.razorpayKeySecretSet && this.settings.enableOnlinePayment;
  }

  /** Where Razorpay sends this clinic's payment notices. */
  get webhookUrl(): string {
    const code = this.settings.clinicCode;
    if (!code) return '';
    const api = environment.apiUrl.startsWith('http') ? environment.apiUrl
      : `${window.location.origin}${environment.apiUrl}`;
    return `${api}/hms/payments/webhook/${encodeURIComponent(code)}`;
  }

  copyWebhookUrl(): void {
    navigator.clipboard?.writeText(this.webhookUrl).then(
      () => this.toast.success('Webhook URL copied'),
      () => this.toast.error('Copy failed. Select the URL and copy it instead.'),
    );
  }

  /** Removes the keys on the next save; online payment stops until new keys are entered. */
  removeRazorpay(): void {
    this.settings = { ...this.settings, razorpayKeyId: '', razorpayKeySecretSet: false, razorpayWebhookSecretSet: false };
    this.razorpaySecret = '';
    this.razorpayWebhookSecret = '';
    this.toast.success('Razorpay will be disconnected when you save.');
  }

  get logoSrc(): string | null {
    return mediaUrl(this.settings.logoUrl);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 512 * 1024) {
      this.toast.error('The image is larger than 512 KB. Please use a smaller one.');
      return;
    }
    this.isUploading = true;
    this.settingService.uploadLogo(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.data) this.settings = { ...this.settings, logoUrl: res.data.logoUrl };
        this.toast.success('Logo updated');
      },
      error: (err) => {
        this.isUploading = false;
        this.toast.error(err?.error?.message || 'The logo could not be uploaded.');
      },
    });
  }

  removeLogo(): void {
    this.isUploading = true;
    this.settingService.removeLogo().subscribe({
      next: () => {
        this.isUploading = false;
        this.settings = { ...this.settings, logoUrl: null };
        this.toast.success('Logo removed');
      },
      error: (err) => {
        this.isUploading = false;
        this.toast.error(err?.error?.message || 'The logo could not be removed.');
      },
    });
  }

  /** The default consultation fee in rupees, as typed. Sent as paise. */
  defaultFee = 0;
  isLoading = false;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  /** Reads the clinic's saved settings from the server, replacing anything typed but not saved. */
  load(): void {
    this.isLoading = true;
    this.error = '';
    this.settingService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.settings = { ...this.settings, ...res.data };
          this.defaultFee = (res.data.defaultConsultationFeeInPaisa ?? 0) / 100;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || 'The settings could not be loaded.';
      },
    });
  }

  save(): void {
    if (this.isSaving) return;
    if (!this.settings.clinicName?.trim()) {
      this.toast.error('Enter the clinic name.');
      return;
    }
    if (!this.settings.patientIdPrefix?.trim()) {
      this.toast.error('Enter a patient ID prefix, for example CLI.');
      return;
    }
    if (!(this.defaultFee >= 0)) {
      this.toast.error('The default consultation fee cannot be negative.');
      return;
    }
    const tax = Number(this.settings.taxRatePercent ?? 0);
    if (!(tax >= 0 && tax <= 100)) {
      this.toast.error('GST must be between 0 and 100%.');
      return;
    }
    const upi = (this.settings.upiPayeeId ?? '').trim();
    if (upi && !/^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$/.test(upi)) {
      this.toast.error('Enter a UPI ID such as clinic@okhdfcbank.');
      return;
    }
    const keyId = (this.settings.razorpayKeyId ?? '').trim();
    if (keyId && !/^rzp_(test|live)_[A-Za-z0-9]{6,40}$/.test(keyId)) {
      this.toast.error('Enter the Razorpay Key ID, which starts with rzp_live_ or rzp_test_.');
      return;
    }
    if (keyId && !this.razorpaySecret.trim() && !this.settings.razorpayKeySecretSet) {
      this.toast.error('Enter the Razorpay key secret for this Key ID.');
      return;
    }
    this.isSaving = true;
    this.settingService
      .update({
        ...this.settings,
        clinicName: this.settings.clinicName.trim(),
        patientIdPrefix: this.settings.patientIdPrefix.trim().toUpperCase(),
        defaultConsultationFeeInPaisa: Math.round(this.defaultFee * 100),
        taxRatePercent: Math.round(tax * 100) / 100,
        upiPayeeId: upi,
        emailSenderName: (this.settings.emailSenderName ?? '').trim(),
        razorpayKeyId: keyId,
        // Only what was typed is sent; a missing value keeps the saved secret.
        razorpayKeySecret: this.razorpaySecret.trim() || undefined,
        razorpayWebhookSecret: this.razorpayWebhookSecret.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success && res.data) {
            this.settings = { ...this.settings, ...res.data };
            this.defaultFee = (res.data.defaultConsultationFeeInPaisa ?? 0) / 100;
            this.razorpaySecret = '';
            this.razorpayWebhookSecret = '';
            this.toast.success('Settings saved');
          } else {
            this.toast.error(res.message || 'The settings could not be saved.');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.error(err?.error?.message || 'The settings could not be saved.');
        },
      });
  }
}
