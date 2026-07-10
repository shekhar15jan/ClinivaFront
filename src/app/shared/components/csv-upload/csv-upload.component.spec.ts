import { TestBed } from '@angular/core/testing';
import { CsvUploadComponent } from './csv-upload.component';
import { vi } from 'vitest';

describe('CsvUploadComponent', () => {
  function setup(overrides: Partial<CsvUploadComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new CsvUploadComponent());
    Object.assign(component, overrides);
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('should have default values', () => {
    const component = setup();
    expect(component.uploadUrl).toBe('');
    expect(component.templateUrl).toBe('');
    expect(component.entityName).toBe('Items');
    expect(component.selectedFile).toBeNull();
    expect(component.uploading).toBe(false);
    expect(component.uploadResult).toBeNull();
  });

  describe('onFileSelected', () => {
    it('should set selectedFile and reset result', () => {
      const component = setup();
      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBe(file);
      expect(component.uploadResult).toBeNull();
    });

    it('should reset previous uploadResult when selecting new file', () => {
      const component = setup();
      component.uploadResult = { success: true, message: 'Done' };
      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.uploadResult).toBeNull();
    });

    it('should do nothing when no files selected', () => {
      const component = setup();
      component.selectedFile = new File(['data'], 'old.csv', { type: 'text/csv' });
      const event = { target: { files: [] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).not.toBeNull();
    });
  });

  describe('clearFile', () => {
    it('should reset selectedFile and uploadResult', () => {
      const component = setup();
      component.selectedFile = new File(['data'], 'test.csv', { type: 'text/csv' });
      component.uploadResult = { success: true, message: 'Done' };
      component.clearFile();
      expect(component.selectedFile).toBeNull();
      expect(component.uploadResult).toBeNull();
    });
  });

  describe('upload', () => {
    it('should not emit or set uploading if no file selected', () => {
      const component = setup();
      const spy = vi.spyOn(component.uploaded, 'emit');
      component.upload();
      expect(spy).not.toHaveBeenCalled();
      expect(component.uploading).toBe(false);
    });

    it('should set uploading and emit uploaded event', () => {
      const component = setup();
      component.selectedFile = new File(['data'], 'test.csv', { type: 'text/csv' });
      const spy = vi.spyOn(component.uploaded, 'emit');
      component.upload();
      expect(component.uploading).toBe(true);
      expect(spy).toHaveBeenCalledWith({ imported: 0, skipped: 0, errors: 0 });
    });

    it('should reset uploadResult on upload', () => {
      const component = setup();
      component.selectedFile = new File(['data'], 'test.csv', { type: 'text/csv' });
      component.uploadResult = { success: true, message: 'Old' };
      component.upload();
      expect(component.uploadResult).toBeNull();
    });
  });
});
