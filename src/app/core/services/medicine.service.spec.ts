import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicineService } from './medicine.service';
import { Medicine } from '../models/medicine.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('MedicineService', () => {
  let service: MedicineService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/medicines`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicineService],
    });
    service = TestBed.inject(MedicineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMedicines', () => {
    it('should GET with pagination and search', () => {
      const mockResponse: ApiResponse<PagedResponse<Medicine>> = {
        success: true,
        data: { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getMedicines(0, 20, 'para').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('page') === '0' && r.params.get('size') === '20' && r.params.get('q') === 'para');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call without optional params', () => {
      service.getMedicines().subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.keys().length === 0);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getMedicineById', () => {
    it('should GET medicine by id', () => {
      const mockResponse: ApiResponse<Medicine> = {
        success: true,
        data: { id: 'm1', medicineName: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'ABC', category: 'Analgesic', unit: 'Tablet', priceInPaisa: 500, quantity: 100, isDiscontinued: false, createdAt: '' },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getMedicineById('m1').subscribe((res) => {
        expect(res.data.medicineName).toBe('Paracetamol');
      });

      const req = httpMock.expectOne(`${baseUrl}/m1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('searchMedicines', () => {
    it('should GET search with query', () => {
      const mockResponse: ApiResponse<Medicine[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.searchMedicines('para').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/search?q=para`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createMedicine', () => {
    it('should POST a new medicine', () => {
      const medicine: Partial<Medicine> = { medicineName: 'Ibuprofen', genericName: 'Ibuprofen', manufacturer: 'XYZ', category: 'Painkiller', unit: 'Tablet', priceInPaisa: 1000, isDiscontinued: false };

      service.createMedicine(medicine).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(medicine);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('updateMedicine', () => {
    it('should PUT to update', () => {
      const update: Partial<Medicine> = { priceInPaisa: 1200 };

      service.updateMedicine('m1', update).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/m1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('deactivate', () => {
    it('should DELETE deactivate', () => {
      service.deactivate('m1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/m1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      req.flush({ success: true, data: undefined } as unknown as ApiResponse<unknown>);
    });

    it('should handle error on deactivate', () => {
      service.deactivate('m1').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/m1`);
      req.flush({ success: false }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('uploadMedicines', () => {
    it('should POST FormData to upload', () => {
      const file = new File(['csv content'], 'medicines.csv', { type: 'text/csv' });

      service.uploadMedicines(file).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush({ success: true, data: { imported: 10, errors: [] } } as unknown as ApiResponse<unknown>);
    });
  });
});
