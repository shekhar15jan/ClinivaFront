import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#003d9b] transition-colors">
      <input
        #fileInput
        type="file"
        accept=".csv"
        class="hidden"
        (change)="onFileSelected($event)"
      />
      <div class="text-4xl mb-3 text-gray-300">\uD83D\uDCC1</div>
      <h3 class="text-sm font-semibold text-gray-700 mb-1">Upload {{ entityName }} CSV</h3>
      <p class="text-xs text-gray-500 mb-4">Drag and drop or click to select a .csv file</p>
      <div class="flex justify-center gap-3">
        <button
          class="px-4 py-2 text-sm font-medium text-[#003d9b] border border-[#003d9b] rounded-lg hover:bg-blue-50 transition-colors"
          (click)="fileInput.click()"
        >Select File</button>
        @if (templateUrl) {
          <a
            [href]="templateUrl"
            download
            class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >Download Template</a>
        }
      </div>
      @if (selectedFile) {
        <div class="mt-4 text-sm text-gray-600">
          Selected: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
          <button class="ml-2 text-red-500 hover:text-red-700" (click)="clearFile()">&times;</button>
        </div>
        <button
          class="mt-3 px-5 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg hover:bg-[#002d75] transition-colors"
          [disabled]="uploading"
          (click)="upload()"
        >{{ uploading ? 'Uploading...' : 'Upload' }}</button>
      }
      @if (uploadResult) {
        <div class="mt-4 p-3 rounded-lg text-sm" [ngClass]="uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
          {{ uploadResult.message }}
        </div>
      }
    </div>
  `
})
export class CsvUploadComponent {
  @Input() uploadUrl = '';
  @Input() templateUrl = '';
  @Input() entityName = 'Items';
  @Output() uploaded = new EventEmitter<{ imported: number; skipped: number; errors: number }>();

  selectedFile: File | null = null;
  uploading = false;
  uploadResult: { success: boolean; message: string } | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.uploadResult = null;
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.uploadResult = null;
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.uploadResult = null;
    this.uploaded.emit({ imported: 0, skipped: 0, errors: 0 });
  }
}
