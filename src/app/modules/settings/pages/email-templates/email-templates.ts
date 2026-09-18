import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailTemplateService } from '../../../../core/services/email-template.service';
import { EmailTemplate, EmailTemplateRequest, EMAIL_TEMPLATE_TYPES } from '../../../../core/models/email-template.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Email Templates</h2>
          <p class="text-sm text-on-surface-variant mt-1">Customize email notifications sent to patients and staff</p>
        </div>
        <button (click)="openCreate()" class="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
          <span class="material-symbols-outlined text-[18px]">add</span>
          New Template
        </button>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <div class="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Type</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Subject</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">From</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (template of templates; track template.id) {
                <tr class="border-b border-outline-variant/50 hover:bg-surface-container-high/50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {{ getTemplateLabel(template.type) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-on-surface">{{ template.subject }}</td>
                  <td class="px-4 py-3 text-sm text-on-surface-variant">{{ template.fromEmail || 'Default' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="openEdit(template)" class="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded transition-colors" title="Edit">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button (click)="deleteTemplate(template)" class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/5 rounded transition-colors ml-1" title="Delete">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-4xl text-outline block mb-2">email</span>
                    No email templates configured. Using system defaults.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Edit/Create Dialog -->
      @if (showDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h3 class="text-lg font-semibold text-on-surface">{{ editingTemplate ? 'Edit' : 'Create' }} Email Template</h3>
              <button (click)="closeDialog()" class="p-1 text-on-surface-variant hover:text-on-surface rounded">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label for="email-tmpl-type" class="block text-xs font-semibold text-outline uppercase tracking-wider mb-1">Template Type</label>
                <select id="email-tmpl-type" [(ngModel)]="form.type" [disabled]="!!editingTemplate" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface">
                  <option value="">Select type</option>
                  @for (t of templateTypes; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="email-tmpl-subject" class="block text-xs font-semibold text-outline uppercase tracking-wider mb-1">Subject</label>
                <input id="email-tmpl-subject" type="text" [(ngModel)]="form.subject" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Email subject line" />
              </div>
              <div>
                <label for="email-tmpl-from" class="block text-xs font-semibold text-outline uppercase tracking-wider mb-1">From Email (optional)</label>
                <input id="email-tmpl-from" type="email" [(ngModel)]="form.fromEmail" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="noreply@cliniva.com" />
              </div>
              <div>
                <label for="email-tmpl-body" class="block text-xs font-semibold text-outline uppercase tracking-wider mb-1">Body</label>
                <textarea id="email-tmpl-body" [(ngModel)]="form.body" rows="6" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono" placeholder="Email body. Use %s for dynamic values."></textarea>
                <p class="text-xs text-outline mt-1">Use <code class="bg-surface-container-high px-1 rounded">%s</code> as placeholder for dynamic values (OTP, names, dates, amounts)</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant">
              <button (click)="closeDialog()" class="px-4 py-2 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
              <button (click)="saveTemplate()" [disabled]="saving || !form.type || !form.subject || !form.body" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors">
                {{ saving ? 'Saving...' : 'Save Template' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmailTemplatesPage implements OnInit {
  private emailTemplateService = inject(EmailTemplateService);
  private toastService = inject(ToastService);

  templates: EmailTemplate[] = [];
  loading = true;
  showDialog = false;
  saving = false;
  editingTemplate: EmailTemplate | null = null;
  templateTypes = EMAIL_TEMPLATE_TYPES;

  form: EmailTemplateRequest = { type: '', subject: '', body: '', fromEmail: '' };

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.emailTemplateService.getTemplates().subscribe({
      next: (res) => {
        this.templates = res.data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getTemplateLabel(type: string): string {
    return this.templateTypes.find(t => t.value === type)?.label ?? type;
  }

  openCreate(): void {
    this.editingTemplate = null;
    this.form = { type: '', subject: '', body: '', fromEmail: '' };
    this.showDialog = true;
  }

  openEdit(template: EmailTemplate): void {
    this.editingTemplate = template;
    this.form = {
      type: template.type,
      subject: template.subject,
      body: template.body,
      fromEmail: template.fromEmail || '',
    };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingTemplate = null;
  }

  saveTemplate(): void {
    this.saving = true;
    if (this.editingTemplate) {
      this.emailTemplateService.updateTemplate(this.editingTemplate.id, this.form).subscribe({
        next: () => {
          this.toastService.success('Template updated');
          this.closeDialog();
          this.loadTemplates();
          this.saving = false;
        },
        error: () => { this.toastService.error('Failed to update'); this.saving = false; }
      });
    } else {
      this.emailTemplateService.createTemplate(this.form).subscribe({
        next: () => {
          this.toastService.success('Template created');
          this.closeDialog();
          this.loadTemplates();
          this.saving = false;
        },
        error: () => { this.toastService.error('Failed to create'); this.saving = false; }
      });
    }
  }

  deleteTemplate(template: EmailTemplate): void {
    if (!confirm('Delete this email template?')) return;
    this.emailTemplateService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.toastService.success('Template deleted');
        this.loadTemplates();
      },
      error: () => this.toastService.error('Failed to delete')
    });
  }
}
