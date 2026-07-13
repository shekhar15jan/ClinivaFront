import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';
import { AuthService } from './auth.service';
import { PatientService } from './patient.service';
import { DoctorService } from './doctor.service';
import { AppointmentService } from './appointment.service';
import { ConsultationService } from './consultation.service';
import { PrescriptionService } from './prescription.service';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';
import { AuthResponse, SendOtpRequest } from '../models/auth.model';
import { ApiResponse } from '../models/common.model';

describe('Full Workflow Integration: Patient → Appointment → Consultation → Prescription → Billing → Payment', () => {
  let authService: AuthService;
  let patientService: PatientService;
  let doctorService: DoctorService;
  let appointmentService: AppointmentService;
  let consultationService: ConsultationService;
  let prescriptionService: PrescriptionService;
  let billingService: BillingService;
  let paymentService: PaymentService;
  let httpMock: HttpTestingController;

  const mockPatient = { id: 'p1', fullName: 'John Doe', dateOfBirth: '1990-01-01', age: 36, gender: 'MALE' as const, phone: '9999999999', email: 'john@test.com', address: '123 Main St', bloodGroup: 'O+', emergencyContactName: 'Jane Doe', emergencyContactPhone: '8888888888', medicalHistory: '', isDeleted: false, patientId: 'CLI-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  const mockDoctor = { id: 'd1', fullName: 'Dr. Test', specialization: 'General', qualification: 'MBBS', licenseNumber: 'LIC123', experienceYears: 10, consultationFeeInPaisa: 50000, phone: '7777777777', email: 'dr@test.com', profilePhotoUrl: '', isActive: true };
  const mockAppointment = { id: 'a1', patient: { id: 'p1', fullName: 'John Doe' }, doctor: { id: 'd1', fullName: 'Dr. Test', specialization: 'General' }, appointmentDate: '2026-01-15', appointmentTime: '09:00', tokenNumber: 1, status: 'APPROVED' as const, reason: 'Checkup', notes: '', createdAt: '2026-01-15' };
  const mockConsultation = { id: 'c1', appointmentId: 'a1', doctorId: 'd1', patientId: 'p1', chiefComplaints: 'Headache', examinationFindings: 'Normal', diagnosis: 'Migraine', clinicalNotes: 'Rest advised', vitals: { bp: '120/80', temperature: '98.6', weight: '70', spo2: '98', pulse: '72' }, createdAt: '2026-01-15' };
  const mockPrescription = { id: 'pr1', consultationId: 'c1', appointmentId: 'a1', doctor: { id: 'd1', fullName: 'Dr. Test', specialization: 'General' }, patient: { id: 'p1', fullName: 'John Doe' }, diagnosis: 'Migraine', date: '2026-01-15', notes: '', medicines: [], createdAt: '2026-01-15' };
  const mockBill = { id: 'b1', patient: { id: 'p1', fullName: 'John Doe', patientId: 'CLI-001' }, appointmentId: 'a1', prescriptionId: 'pr1', billNumber: 'INV-001', consultationFeeInPaisa: 50000, medicineChargesInPaisa: 15000, additionalChargesInPaisa: 0, discountInPaisa: 0, taxInPaisa: 0, totalAmountInPaisa: 65000, paymentStatus: 'UNPAID' as const, billDate: '2026-01-15', isVoided: false, createdAt: '2026-01-15' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService, PatientService, DoctorService, AppointmentService,
        ConsultationService, PrescriptionService, BillingService, PaymentService,
      ],
    });

    authService = TestBed.inject(AuthService);
    patientService = TestBed.inject(PatientService);
    doctorService = TestBed.inject(DoctorService);
    appointmentService = TestBed.inject(AppointmentService);
    consultationService = TestBed.inject(ConsultationService);
    prescriptionService = TestBed.inject(PrescriptionService);
    billingService = TestBed.inject(BillingService);
    paymentService = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('Step 0: should login and get JWT', () => {
    const sendOtpReq: SendOtpRequest = { email: 'admin@cliniva.com' };

    authService.sendOtp(sendOtpReq).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/auth/send-otp'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OTP sent' });

    const mockAuth: ApiResponse<AuthResponse> = {
      success: true,
      data: { token: 'jwt-token', refreshToken: 'refresh-token', user: { id: 'u1', email: 'admin@cliniva.com', role: 'ADMIN' }, tenant: { id: 't1', name: 'Test Clinic', activeModules: [] } },
      message: '', timestamp: '', requestId: '',
    };

    authService.verifyOtp({ email: 'admin@cliniva.com', otp: '123456' }).subscribe();

    const verifyReq = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/auth/verify-otp'));
    verifyReq.flush(mockAuth);

    expect(authService.isLoggedIn()).toBe(true);
  });

  it('Step 1: should create a patient', () => {
    const apiResp: ApiResponse<typeof mockPatient> = { success: true, data: mockPatient, message: '', timestamp: '', requestId: '' };
    patientService.createPatient(mockPatient).subscribe((res) => {
      expect(res.data?.fullName).toBe('John Doe');
      expect(res.data?.gender).toBe('MALE');
    });

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/patients') && r.method === 'POST');
    req.flush(apiResp);
  });

  it('Step 2: should get doctors and book appointment', () => {
    const doctorResp: ApiResponse<typeof mockDoctor> = { success: true, data: mockDoctor, message: '', timestamp: '', requestId: '' };
    doctorService.getDoctorById('d1').subscribe((res) => {
      expect(res.data?.specialization).toBe('General');
      expect(res.data?.consultationFeeInPaisa).toBe(50000);
    });

    const docReq = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/doctors/d1'));
    docReq.flush(doctorResp);

    const appointmentResp: ApiResponse<typeof mockAppointment> = { success: true, data: mockAppointment, message: '', timestamp: '', requestId: '' };
    appointmentService.createAppointment({
      patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-01-15', appointmentTime: '09:00', reason: 'Checkup',
    }).subscribe((res) => {
      expect(res.data?.status).toBe('APPROVED');
      expect(res.data?.tokenNumber).toBe(1);
    });

    const aptReq = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/appointments') && r.method === 'POST');
    aptReq.flush(appointmentResp);
  });

  it('Step 3: should create consultation with vitals', () => {
    const consultationResp: ApiResponse<typeof mockConsultation> = { success: true, data: mockConsultation, message: '', timestamp: '', requestId: '' };
    consultationService.createConsultation({
      appointmentId: 'a1',
      chiefComplaints: 'Headache', examinationFindings: 'Normal', diagnosis: 'Migraine',
      vitals: { bp: '120/80', temperature: '98.6', weight: '70', spo2: '98', pulse: '72' },
    }).subscribe((res) => {
      expect(res.data?.diagnosis).toBe('Migraine');
      expect(res.data?.vitals?.bp).toBe('120/80');
    });

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/consultations') && r.method === 'POST');
    req.flush(consultationResp);
  });

  it('Step 4: should create prescription with medicines', () => {
    const prescriptionResp: ApiResponse<typeof mockPrescription> = { success: true, data: mockPrescription, message: '', timestamp: '', requestId: '' };
    prescriptionService.createPrescription({
      consultationId: 'c1',
      diagnosis: 'Migraine', medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: 5, durationUnit: 'DAYS' }],
    }).subscribe((res) => {
      expect(res.data?.diagnosis).toBe('Migraine');
    });

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/prescriptions') && r.method === 'POST');
    req.flush(prescriptionResp);
  });

  it('Step 5: should generate bill from prescription', () => {
    const billResp: ApiResponse<typeof mockBill> = { success: true, data: mockBill, message: '', timestamp: '', requestId: '' };
    const billReq = { prescriptionId: 'pr1' };
    billingService.createBill('pr1', billReq).subscribe((res) => {
      expect(res.data?.totalAmountInPaisa).toBe(65000);
      expect(res.data?.paymentStatus).toBe('UNPAID');
    });

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/bills') && r.method === 'POST');
    req.flush(billResp);
  });

  it('Step 6: should process payment for bill', () => {
    paymentService.createOrder({ billId: 'b1', amountInPaisa: 65000 }).subscribe((res) => {
      expect(res.data?.razorpayOrderId).toBe('order_123');
      expect(res.data?.amountInPaisa).toBe(65000);
    });

    const orderReq = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/payments/create-order'));
    orderReq.flush({ success: true, data: { razorpayOrderId: 'order_123', razorpayKeyId: 'rzp_test', amountInPaisa: 65000, currency: 'INR', billId: 'b1' }, message: '', timestamp: '', requestId: '' });

    paymentService.savePayment({ billId: 'b1', amountInPaisa: 65000, paymentMethod: 'UPI', paymentMode: 'ONLINE' }).subscribe((res) => {
      expect(res.data?.paymentStatus).toBe('SUCCESS');
    });

    const saveReq = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/payments/save'));
    saveReq.flush({ success: true, data: { id: 'pay1', billId: 'b1', amountInPaisa: 65000, paymentMethod: 'UPI', paymentMode: 'ONLINE', paymentStatus: 'SUCCESS', paidAt: '2026-01-15T00:00:00Z', createdAt: '2026-01-15T00:00:00Z' }, message: '', timestamp: '', requestId: '' });
  });

  it('Full chain: 7-service orchestration confirms all dependencies wired correctly', () => {
    let completed = 0;
    const step = () => { completed++; };

    patientService.getPatients(0, 10).subscribe({ next: step, error: step });
    const p1 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/patients'));
    expect(p1.request.method).toBe('GET');
    p1.flush({ success: true, data: { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true }, message: '', timestamp: '', requestId: '' });

    doctorService.getDoctors().subscribe({ next: step, error: step });
    const p2 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/doctors') && !r.url.includes('with-slots') && !r.url.includes('availability'));
    expect(p2.request.method).toBe('GET');
    p2.flush({ success: true, data: [], message: '', timestamp: '', requestId: '' });

    appointmentService.getAppointments(0, 20).subscribe({ next: step, error: step });
    const p3 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/appointments'));
    expect(p3.request.method).toBe('GET');
    p3.flush({ success: true, data: { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0, last: true }, message: '', timestamp: '', requestId: '' });

    consultationService.getByAppointment('a1').subscribe({ next: step, error: step });
    const p4 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/consultations'));
    expect(p4.request.method).toBe('GET');
    p4.flush({ success: true, data: null, message: '', timestamp: '', requestId: '' });

    prescriptionService.getPrescriptionsByPatient('p1').subscribe({ next: step, error: step });
    const p5 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/prescriptions'));
    expect(p5.request.method).toBe('GET');
    p5.flush({ success: true, data: [], message: '', timestamp: '', requestId: '' });

    billingService.getBills(0, 20).subscribe({ next: step, error: step });
    const p6 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/bills'));
    expect(p6.request.method).toBe('GET');
    p6.flush({ success: true, data: { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0, last: true }, message: '', timestamp: '', requestId: '' });

    paymentService.getHistory().subscribe({ next: step, error: step });
    const p7 = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.includes('/hms/payments/history'));
    expect(p7.request.method).toBe('GET');
    p7.flush({ success: true, data: [], message: '', timestamp: '', requestId: '' });

    expect(completed).toBe(7);
  });
});
