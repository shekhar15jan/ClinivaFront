import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Patient } from '../models/patient.model';
import { Doctor } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';
import { Consultation } from '../models/consultation.model';
import { Prescription } from '../models/prescription.model';
import { Bill } from '../models/billing.model';
import { Medicine } from '../models/medicine.model';
import { DashboardStats } from '../models/report.model';
import { ClinicSettings } from '../models/setting.model';
import { User } from '../models/auth.model';

interface TenantResolution {
  tenant: {
    tenantId: string;
    name: string;
    code: string;
    status: string;
  };
  modules: { moduleCode: string; moduleName: string; status: string; isCore: boolean; source: string }[];
  subscription: {
    planName: string;
    status: string;
    endDate: string;
    maxDoctors?: number;
    maxPatients?: number;
  };
}

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {

  private patients: Patient[] = [
    // Tenant A (Clinica Hospital) - t1
    { id: '1', patientId: 'CLI-001', fullName: 'Rahul Sharma', dateOfBirth: '1985-06-15', age: 39, gender: 'MALE', phone: '9876543210', email: 'rahul@example.com', bloodGroup: 'A+', address: '123 Mumbai St' },
    { id: '2', patientId: 'CLI-002', fullName: 'Priya Patel', dateOfBirth: '1992-09-20', age: 33, gender: 'FEMALE', phone: '9876543211', email: 'priya@example.com', bloodGroup: 'B+', address: '456 Delhi Ave' },
    { id: '3', patientId: 'CLI-003', fullName: 'Amit Singh', dateOfBirth: '1978-03-10', age: 48, gender: 'MALE', phone: '9876543212', email: 'amit@example.com', bloodGroup: 'O+' },
    // Tenant B (Wellness Clinic) - t2
    { id: '4', patientId: 'WEL-001', fullName: 'John Doe', dateOfBirth: '1988-07-14', age: 36, gender: 'MALE', phone: '9876543220', email: 'john@wellness.com', bloodGroup: 'A+', address: '111 Wellness Road' },
    { id: '5', patientId: 'WEL-002', fullName: 'Mary Smith', dateOfBirth: '1992-09-22', age: 33, gender: 'FEMALE', phone: '9876543221', email: 'mary@wellness.com', bloodGroup: 'B+', address: '222 Health Street' },
  ];

  private doctors: Doctor[] = [
    // Tenant A (Clinica Hospital)
    { id: 'd1', fullName: 'Dr. Anita Desai', specialization: 'Cardiologist', qualification: 'MBBS, MD', consultationFeeInPaisa: 50000, isActive: true, phone: '9876543210', email: 'anita.desai@cliniva.com' },
    { id: 'd2', fullName: 'Dr. Vivek Kumar', specialization: 'General Physician', qualification: 'MBBS', consultationFeeInPaisa: 30000, isActive: true, phone: '9876543211', email: 'vivek.kumar@cliniva.com' },
    { id: 'd3', fullName: 'Dr. Sneha Patel', specialization: 'Dermatologist', qualification: 'MBBS, MD', consultationFeeInPaisa: 40000, isActive: true, phone: '9876543212', email: 'sneha.patel@cliniva.com' },
    { id: 'd4', fullName: 'Dr. Rajesh Gupta', specialization: 'Pediatrician', qualification: 'MBBS, MD', consultationFeeInPaisa: 35000, isActive: false, phone: '9876543213', email: 'rajesh.gupta@cliniva.com' },
    // Tenant B (Wellness Clinic)
    { id: 'd5', fullName: 'Dr. Robert Chen', specialization: 'General Physician', qualification: 'MBBS', consultationFeeInPaisa: 25000, isActive: true, phone: '9876543310', email: 'robert.chen@wellness.com' },
    { id: 'd6', fullName: 'Dr. Lisa Wang', specialization: 'Pediatrician', qualification: 'MBBS, MD', consultationFeeInPaisa: 30000, isActive: true, phone: '9876543311', email: 'lisa.wang@wellness.com' },
  ];

  private appointments: Appointment[] = [
    // Tenant A appointments
    { id: 'a1', patient: { id: '1', fullName: 'Rahul Sharma' }, doctor: { id: 'd1', fullName: 'Dr. Anita Desai' }, appointmentDate: '2026-07-02', appointmentTime: '09:30', tokenNumber: 1, status: 'APPROVED' },
    { id: 'a2', patient: { id: '2', fullName: 'Priya Patel' }, doctor: { id: 'd2', fullName: 'Dr. Vivek Kumar' }, appointmentDate: '2026-07-02', appointmentTime: '10:00', tokenNumber: 2, status: 'APPROVED' },
    { id: 'a3', patient: { id: '3', fullName: 'Amit Singh' }, doctor: { id: 'd1', fullName: 'Dr. Anita Desai' }, appointmentDate: '2026-07-02', appointmentTime: '11:00', tokenNumber: 3, status: 'PENDING' },
    // Tenant B appointments
    { id: 'a4', patient: { id: '4', fullName: 'John Doe' }, doctor: { id: 'd5', fullName: 'Dr. Robert Chen' }, appointmentDate: '2026-07-02', appointmentTime: '09:30', tokenNumber: 1, status: 'APPROVED' },
    { id: 'a5', patient: { id: '5', fullName: 'Mary Smith' }, doctor: { id: 'd6', fullName: 'Dr. Lisa Wang' }, appointmentDate: '2026-07-02', appointmentTime: '10:00', tokenNumber: 2, status: 'PENDING' },
  ];

  private consultations: Consultation[] = [
    { id: 'c1', appointmentId: 'a1', patientId: '1', doctorId: 'd1', chiefComplaints: 'Chest pain and shortness of breath', examinationFindings: 'BP 140/90, ECG normal', diagnosis: 'Hypertension', clinicalNotes: 'Patient advised lifestyle modifications', vitals: { bp: '140/90', temperature: '98.6', weight: '78', spo2: '98', pulse: '82' }, createdAt: '2026-07-02T09:30:00' },
    { id: 'c2', appointmentId: 'a2', patientId: '2', doctorId: 'd2', chiefComplaints: 'Fever and cough for 3 days', examinationFindings: 'Throat redness, mild fever 100.2F', diagnosis: 'Upper respiratory tract infection', clinicalNotes: 'Prescribed antibiotics and rest', createdAt: '2026-07-01T14:00:00' },
  ];

  private prescriptions: Prescription[] = [
    { id: 'rx-001', consultationId: 'c1', patient: { id: '1', fullName: 'Rahul Sharma' }, doctor: { id: 'd1', fullName: 'Dr. Anita Desai' }, medicines: [{ medicineName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: 5, durationUnit: 'DAYS' }], createdAt: '2026-06-25T10:30:00' },
    { id: 'rx-002', consultationId: 'c2', patient: { id: '2', fullName: 'Priya Patel' }, doctor: { id: 'd2', fullName: 'Dr. Vivek Kumar' }, medicines: [{ medicineName: 'Amoxicillin 250mg', dosage: '1 capsule', frequency: '2 times daily', duration: 7, durationUnit: 'DAYS' }, { medicineName: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: 5, durationUnit: 'DAYS' }], createdAt: '2026-07-01T14:00:00' },
  ];

  private bills: Bill[] = [
    { id: 'b-001', appointmentId: 'a1', patient: { id: '1', fullName: 'Rahul Sharma' }, consultationFeeInPaisa: 50000, discountInPaisa: 0, taxInPaisa: 0, totalAmountInPaisa: 52500, paymentStatus: 'PAID', createdAt: '2026-06-25T11:00:00' },
    { id: 'b-002', appointmentId: 'a2', patient: { id: '2', fullName: 'Priya Patel' }, consultationFeeInPaisa: 30000, discountInPaisa: 0, taxInPaisa: 0, totalAmountInPaisa: 41900, paymentStatus: 'UNPAID', createdAt: '2026-07-01T14:30:00' },
  ];

  private medicines: Medicine[] = [
    { id: 'm1', medicineName: 'Paracetamol 500mg', genericName: 'Paracetamol', manufacturer: 'Cipla', category: 'Analgesic', unit: 'tablet', priceInPaisa: 250, quantity: 500, isDiscontinued: false, createdAt: '2026-01-01' },
    { id: 'm2', medicineName: 'Amoxicillin 250mg', genericName: 'Amoxicillin', manufacturer: 'Sun Pharma', category: 'Antibiotic', unit: 'capsule', priceInPaisa: 850, quantity: 200, isDiscontinued: false, createdAt: '2026-01-01' },
    { id: 'm3', medicineName: 'Cetirizine 10mg', genericName: 'Cetirizine', manufacturer: 'Dr. Reddy\'s', category: 'Antihistamine', unit: 'tablet', priceInPaisa: 180, quantity: 300, isDiscontinued: false, createdAt: '2026-01-01' },
    { id: 'm4', medicineName: 'Vitamin D3 60K', genericName: 'Cholecalciferol', manufacturer: 'Abbott', category: 'Vitamin', unit: 'capsule', priceInPaisa: 350, quantity: 150, isDiscontinued: false, createdAt: '2026-01-01' },
    { id: 'm5', medicineName: 'Omeprazole 20mg', genericName: 'Omeprazole', manufacturer: 'GSK', category: 'Antacid', unit: 'capsule', priceInPaisa: 450, quantity: 100, isDiscontinued: false, createdAt: '2026-01-01' },
  ];

  private users: User[] = [
    // Tenant A (Clinica Hospital)
    { id: 'u1', email: 'admin@clinivahms.com', role: 'ADMIN', tenantId: 't1', tenantCode: 'CLINICA' },
    { id: 'u2', email: 'doctor@clinic-a.com', role: 'DOCTOR', tenantId: 't1', tenantCode: 'CLINICA' },
    { id: 'u3', email: 'receptionist@clinic-a.com', role: 'RECEPTIONIST', tenantId: 't1', tenantCode: 'CLINICA' },
    { id: 'u4', email: 'nurse@clinic-a.com', role: 'NURSE', tenantId: 't1', tenantCode: 'CLINICA' },
    { id: 'u5', email: 'patient@clinic-a.com', role: 'PATIENT', tenantId: 't1', tenantCode: 'CLINICA' },
    // Tenant B (Wellness Clinic)
    { id: 'u6', email: 'admin@clinic-b.com', role: 'ADMIN', tenantId: 't2', tenantCode: 'WELNESS' },
    { id: 'u7', email: 'doctor@clinic-b.com', role: 'DOCTOR', tenantId: 't2', tenantCode: 'WELNESS' },
    { id: 'u8', email: 'receptionist@clinic-b.com', role: 'RECEPTIONIST', tenantId: 't2', tenantCode: 'WELNESS' },
    { id: 'u9', email: 'nurse@clinic-b.com', role: 'NURSE', tenantId: 't2', tenantCode: 'WELNESS' },
    { id: 'u10', email: 'patient@clinic-b.com', role: 'PATIENT', tenantId: 't2', tenantCode: 'WELNESS' },
  ];

  private mockToken = 'mock.jwt.token.admin';
  private mockRefreshToken = 'mock.refresh.token.admin';
  private lastOtpEmail: string | null = null;

  private settings: ClinicSettings = {
    clinicName: 'Cliniva Hospital',
    address: '123 Healthcare Avenue, Medical District',
    phone: '+91 9876543210',
    email: 'admin@clinivahms.com',
    patientIdPrefix: 'CLI',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultConsultationFeeInPaisa: 50000,
    enableOnlinePayment: true,
    enableOtpLogin: true,
  };

  private getTenantConfig(email: string) {
    if (email.includes('clinic-a.com') || email === 'admin@clinivahms.com') {
      return {
        tenantId: 't1',
        tenantName: 'Clinica Hospital',
        tenantCode: 'CLINICA',
        modules: [
          { moduleCode: 'PATIENT', moduleName: 'Patient Management', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'CONSULTATION', moduleName: 'Consultation', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'PAYMENT', moduleName: 'Payment', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'SETTINGS', moduleName: 'Settings', status: 'ACTIVE', isCore: true, source: 'CORE' },
        ],
        subscription: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 },
      };
    }
    // Tenant B - Wellness Clinic (billing and payment disabled)
    return {
      tenantId: 't2',
      tenantName: 'Wellness Clinic',
      tenantCode: 'WELNESS',
      modules: [
        { moduleCode: 'PATIENT', moduleName: 'Patient Management', status: 'ACTIVE', isCore: true, source: 'CORE' },
        { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', status: 'ACTIVE', isCore: true, source: 'CORE' },
        { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', status: 'ACTIVE', isCore: false, source: 'PLAN' },
        { moduleCode: 'CONSULTATION', moduleName: 'Consultation', status: 'ACTIVE', isCore: false, source: 'PLAN' },
        { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', status: 'ACTIVE', isCore: false, source: 'PLAN' },
        { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', status: 'DISABLED', isCore: false, source: 'PLAN' },
        { moduleCode: 'PAYMENT', moduleName: 'Payment', status: 'DISABLED', isCore: false, source: 'PLAN' },
        { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', status: 'ACTIVE', isCore: false, source: 'PLAN' },
        { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', status: 'ACTIVE', isCore: false, source: 'PLAN' },
        { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', status: 'ACTIVE', isCore: true, source: 'CORE' },
        { moduleCode: 'SETTINGS', moduleName: 'Settings', status: 'ACTIVE', isCore: true, source: 'CORE' },
      ],
      subscription: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 },
    };
  }

  private getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  private extractId(url: string, segmentsFromEnd: number): string | undefined {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    return parts[parts.length - segmentsFromEnd];
  }

  // Helper to extract tenantId from request (from JWT or header)
  private getTenantIdFromRequest(request: HttpRequest<unknown>): string {
    // First try to get from Authorization header (JWT)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Mock JWT parsing - extract tenantId from token
      if (token.includes('.t1.')) return 't1';
      if (token.includes('.t2.')) return 't2';
      // Default to t1 for backward compatibility
      return 't1';
    }
    return 't1'; // Default tenant
  }

  // Internal tenant mappings (not part of model, used for mock filtering)
  private patientTenantMap: Record<string, string> = { '1': 't1', '2': 't1', '3': 't1', '4': 't2', '5': 't2' };
  private doctorTenantMap: Record<string, string> = { 'd1': 't1', 'd2': 't1', 'd3': 't1', 'd4': 't1', 'd5': 't2', 'd6': 't2' };

  // Helper to filter patients by tenant
  private getPatientsForTenant(request: HttpRequest<unknown>): Patient[] {
    const tenantId = this.getTenantIdFromRequest(request);
    return this.patients.filter(p => this.patientTenantMap[p.id] === tenantId);
  }

  // Helper to filter doctors by tenant
  private getDoctorsForTenant(request: HttpRequest<unknown>): Doctor[] {
    const tenantId = this.getTenantIdFromRequest(request);
    return this.doctors.filter(d => this.doctorTenantMap[d.id] === tenantId);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (environment.production || !environment.enableMock) {
      return next.handle(request);
    }

    const { method, body } = request;
    const fullUrl = request.urlWithParams;
    const url = request.url;

    // ─── Auth ───────────────────────────────────────────────────────
    // Real backend endpoints: /auth/login, /auth/verify-password, /auth/send-otp, /auth/verify-otp, /auth/refresh, /auth/logout
    const validUsers: Record<string, { password: string; user: User }> = {};
    for (const u of this.users) {
      validUsers[u.email] = { password: 'test123', user: u };
    }

    if (url.includes('/auth/login') && method === 'POST') {
      const loginReq = body as { email: string; password: string };
      const match = validUsers[loginReq.email];
      if (match && loginReq.password === match.password) {
        this.lastOtpEmail = loginReq.email;
        return of(new HttpResponse({ status: 200, body: { success: true, data: { requiresOtp: true, message: 'Password verified. OTP required.' } } })).pipe(delay(500));
      }
      return of(new HttpResponse({ status: 401, body: { success: false, message: 'Invalid email or password.' } })).pipe(delay(500));
    }

    if (url.includes('/auth/verify-password') && method === 'POST') {
      const req = body as { email: string; password: string };
      const match = validUsers[req.email];
      if (match && req.password === match.password) {
        this.lastOtpEmail = req.email;
        return of(new HttpResponse({ status: 200, body: { success: true, data: { success: true, requiresOtp: true, message: 'Password verified. OTP required.' } } })).pipe(delay(400));
      }
      return of(new HttpResponse({ status: 401, body: { success: false, message: 'Invalid email or password.' } })).pipe(delay(400));
    }

    if (url.includes('/auth/send-otp') && method === 'POST') {
      const req = body as { email: string };
      const user = this.getUserByEmail(req.email);
      if (user) {
        this.lastOtpEmail = req.email;
        return of(new HttpResponse({ status: 200, body: { success: true, message: 'OTP sent successfully to ' + req.email } })).pipe(delay(500));
      }
      // Allow any email for OTP to support registration flow
      this.lastOtpEmail = req.email;
      return of(new HttpResponse({ status: 200, body: { success: true, message: 'OTP sent successfully' } })).pipe(delay(500));
    }

    if (url.includes('/auth/verify-otp') && method === 'POST') {
      const req = body as { email?: string };
      const email = req?.email || this.lastOtpEmail || 'admin@clinivahms.com';
      const user = this.getUserByEmail(email) || this.users[0];
      const tenantConfig = this.getTenantConfig(user.email);
      
      this.lastOtpEmail = null;
      
      // For test compatibility - return specific mock token format
      const token = email === 'test@cliniva.com' ? 'mock.jwt.token.admin' : `mock.jwt.token.${user.id}.${user.role}.${user.tenantId}`;
      const refreshToken = `mock.refresh.token.${user.id}`;
      
      return of(new HttpResponse({ 
        status: 200, 
        body: { 
          success: true, 
          data: { 
            accessToken: token, 
            refreshToken: refreshToken, 
            user: { 
              id: user.id,
              email: user.email, 
              role: user.role,
              tenantId: user.tenantId,
              tenantCode: user.tenantCode
            },
            tenant: tenantConfig
          } 
        } 
      })).pipe(delay(500));
    }

    if (url.includes('/auth/refresh') && method === 'POST') {
      const req = body as { email?: string };
      const email = req?.email || 'admin@clinivahms.com';
      const user = this.getUserByEmail(email) || this.users[0];
      const tenantConfig = this.getTenantConfig(user.email);
      const token = `mock.jwt.token.${user.id}.${user.role}.${user.tenantId}`;
      const refreshToken = `mock.refresh.token.${user.id}`;
      
      return of(new HttpResponse({ 
        status: 200, 
        body: { 
          success: true, 
          data: { 
            accessToken: token, 
            refreshToken: refreshToken, 
            user: { 
              id: user.id,
              email: user.email, 
              role: user.role,
              tenantId: user.tenantId,
              tenantCode: user.tenantCode
            },
            tenant: tenantConfig
          } 
        } 
      })).pipe(delay(200));
    }

    if (url.includes('/auth/logout') && method === 'POST') {
      return of(new HttpResponse({ status: 200, body: { success: true, message: 'Logged out successfully' } })).pipe(delay(200));
    }

    // ─── Tenant Resolution ──────────────────────────────────────────
    if (url.includes('/tenant/resolve-by-email') && method === 'GET') {
      const resolutions: TenantResolution[] = [{
        tenant: { tenantId: 't1', name: 'Cliniva Medical Center', code: 'CLINIVA', status: 'ACTIVE' },
        modules: [
          { moduleCode: 'PATIENT', moduleName: 'Patient Management', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'CONSULTATION', moduleName: 'Consultation', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'PAYMENT', moduleName: 'Payment', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', status: 'ACTIVE', isCore: false, source: 'PLAN' },
          { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', status: 'ACTIVE', isCore: true, source: 'CORE' },
        ],
        subscription: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 },
      }];
      return of(new HttpResponse({ status: 200, body: { success: true, data: resolutions } })).pipe(delay(300));
    }

    if (url.includes('/tenant/resolve') && method === 'GET') {
      const code = fullUrl.split('code=')[1]?.split('&')[0];
      if (code === 'CLINICA' || code === 'CLINIVA') {
        return of(new HttpResponse({ status: 200, body: { success: true, data: {
          tenant: { tenantId: 't1', name: 'Cliniva Medical Center', code: 'CLINICA', status: 'ACTIVE' },
          modules: [
            { moduleCode: 'PATIENT', moduleName: 'Patient Management', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'CONSULTATION', moduleName: 'Consultation', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'PAYMENT', moduleName: 'Payment', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'SETTINGS', moduleName: 'Settings', status: 'ACTIVE', isCore: true, source: 'CORE' },
          ],
          subscription: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 },
        } } })).pipe(delay(300));
      }
      if (code === 'WELNESS') {
        return of(new HttpResponse({ status: 200, body: { success: true, data: {
          tenant: { tenantId: 't2', name: 'Wellness Clinic', code: 'WELNESS', status: 'ACTIVE' },
          modules: [
            { moduleCode: 'PATIENT', moduleName: 'Patient Management', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'CONSULTATION', moduleName: 'Consultation', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', status: 'DISABLED', isCore: false, source: 'PLAN' },
            { moduleCode: 'PAYMENT', moduleName: 'Payment', status: 'DISABLED', isCore: false, source: 'PLAN' },
            { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', status: 'ACTIVE', isCore: false, source: 'PLAN' },
            { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', status: 'ACTIVE', isCore: true, source: 'CORE' },
            { moduleCode: 'SETTINGS', moduleName: 'Settings', status: 'ACTIVE', isCore: true, source: 'CORE' },
          ],
          subscription: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 },
        } } })).pipe(delay(300));
      }
      return of(new HttpResponse({ status: 404, body: { success: false, message: 'Tenant not found' } })).pipe(delay(300));
    }

    if (url.match(/\/tenant\/[\w-]+\/modules/) && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: [
        { moduleCode: 'PATIENT', moduleName: 'Patient Management', isCore: true, source: 'CORE', status: 'ACTIVE' },
        { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', isCore: true, source: 'CORE', status: 'ACTIVE' },
        { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', isCore: false, source: 'PLAN', status: 'ACTIVE' },
        { moduleCode: 'CONSULTATION', moduleName: 'Consultation', isCore: false, source: 'PLAN', status: 'ACTIVE' },
        { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', isCore: false, source: 'PLAN', status: 'ACTIVE' },
        { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', isCore: false, source: 'PLAN', status: 'ACTIVE' },
      ] } })).pipe(delay(200));
    }

    if (url.match(/\/tenant\/[\w-]+\/subscription/) && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { planName: 'Clinic Standard', status: 'ACTIVE', endDate: '2027-07-01', maxDoctors: 5, maxPatients: 500 } } })).pipe(delay(200));
    }

    // ─── Onboarding ─────────────────────────────────────────────────
    if (url.includes('/tenant/onboarding') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { step: 'CLINIC', completed: false } } })).pipe(delay(200));
    }

    if (url.includes('/tenant/onboarding') && method === 'POST') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { step: 'COMPLETE', completed: true } } })).pipe(delay(300));
    }

    // ─── Patients ───────────────────────────────────────────────────
    // GET /hms/patients/{id}/visits — most specific first
    if (url.match(/\/hms\/patients\/[\w-]+\/visits/) && method === 'GET') {
      const patientId = this.extractId(url, 2);
      return of(new HttpResponse({ status: 200, body: { success: true, data: {
        consultations: this.consultations.filter(c => c.patientId === patientId),
        prescriptions: this.prescriptions.filter(p => p.patient.id === patientId),
        bills: this.bills.filter(b => b.patient.id === patientId),
      } } })).pipe(delay(300));
    }

    // GET /hms/patients/{id}
    if (url.match(/\/hms\/patients\/[\w-]+$/) && method === 'GET') {
      const id = url.split('/').pop();
      const tenantPatients = this.getPatientsForTenant(request);
      const patient = tenantPatients.find(p => p.id === id);
      if (patient) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: patient } })).pipe(delay(300));
      }
      return of(new HttpResponse({ status: 404, body: { success: false, message: 'Patient not found' } })).pipe(delay(300));
    }

    // GET /hms/patients — broad list (tenant filtered)
    if (url.includes('/hms/patients') && method === 'GET' && !url.includes('visits')) {
      const tenantPatients = this.getPatientsForTenant(request);
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: tenantPatients, totalElements: tenantPatients.length } } })).pipe(delay(300));
    }

    // POST /hms/patients
    if (url.includes('/hms/patients') && method === 'POST') {
      const tenantId = this.getTenantIdFromRequest(request);
      const newPatient = { ...(body as Patient), id: Math.random().toString(36).substr(2, 9), patientId: `${this.settings.patientIdPrefix}-00${this.patients.length + 1}` };
      this.patientTenantMap[newPatient.id] = tenantId;
      this.patients.push(newPatient);
      return of(new HttpResponse({ status: 200, body: { success: true, data: newPatient } })).pipe(delay(500));
    }

    // PUT /hms/patients/{id}
    if (url.match(/\/hms\/patients\/[\w-]+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const idx = this.patients.findIndex(p => p.id === id);
      if (idx >= 0) {
        this.patients[idx] = { ...this.patients[idx], ...(body as Partial<Patient>) };
        return of(new HttpResponse({ status: 200, body: { success: true, data: this.patients[idx] } })).pipe(delay(300));
      }
    }

    // ─── Doctors ────────────────────────────────────────────────────
    if (url.includes('/hms/doctors/with-slots') && method === 'GET') {
      const tenantDoctors = this.getDoctorsForTenant(request);
      const doctorsWithSlots = tenantDoctors.map(d => ({ doctor: d, availability: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '09:30' }, { dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '10:00' }, { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '10:30' }, { dayOfWeek: 'MONDAY', startTime: '10:30', endTime: '11:00' }, { dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '11:30' }, { dayOfWeek: 'MONDAY', startTime: '11:30', endTime: '12:00' }] }));
      return of(new HttpResponse({ status: 200, body: { success: true, data: doctorsWithSlots } })).pipe(delay(300));
    }

    if (url.match(/\/hms\/doctors\/\w+$/) && method === 'GET') {
      const id = url.split('/').pop();
      const tenantDoctors = this.getDoctorsForTenant(request);
      const doctor = tenantDoctors.find(d => d.id === id);
      if (doctor) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: doctor } })).pipe(delay(300));
      }
    }

    if (url.includes('/hms/doctors') && method === 'GET') {
      const tenantDoctors = this.getDoctorsForTenant(request);
      return of(new HttpResponse({ status: 200, body: { success: true, data: tenantDoctors } })).pipe(delay(300));
    }

    if (url.includes('/hms/doctors') && method === 'POST') {
      const req = body as Partial<Doctor>;
      const tenantId = this.getTenantIdFromRequest(request);
      const newDoc: Doctor = { id: 'd' + (this.doctors.length + 1), fullName: req.fullName || '', specialization: req.specialization || 'General Physician', qualification: req.qualification || 'MBBS', consultationFeeInPaisa: req.consultationFeeInPaisa || 30000, isActive: true, phone: req.phone, email: req.email };
      this.doctorTenantMap[newDoc.id] = tenantId;
      this.doctors.push(newDoc);
      return of(new HttpResponse({ status: 200, body: { success: true, data: newDoc } })).pipe(delay(400));
    }

    if (url.match(/\/hms\/doctors\/\w+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const tenantDoctors = this.getDoctorsForTenant(request);
      const idx = tenantDoctors.findIndex(d => d.id === id);
      if (idx >= 0) {
        tenantDoctors[idx] = { ...tenantDoctors[idx], ...(body as Partial<Doctor>) };
        return of(new HttpResponse({ status: 200, body: { success: true, data: tenantDoctors[idx] } })).pipe(delay(300));
      }
    }

    if (url.match(/\/hms\/doctors\/\w+$/) && method === 'DELETE') {
      const id = url.split('/').pop();
      this.doctors = this.doctors.filter(d => d.id !== id);
      return of(new HttpResponse({ status: 200, body: { success: true } })).pipe(delay(300));
    }

    // ─── Appointments ───────────────────────────────────────────────
    if (url.includes('/hms/appointments') && method === 'POST') {
      const newAppt = body as { patientId: string; doctorId: string; appointmentDate: string; appointmentTime: string; reason?: string };
      const appt: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        patient: { id: newAppt.patientId, fullName: this.patients.find(p => p.id === newAppt.patientId)?.fullName || 'Unknown' },
        doctor: { id: newAppt.doctorId, fullName: this.doctors.find(d => d.id === newAppt.doctorId)?.fullName || 'Unknown' },
        appointmentDate: newAppt.appointmentDate,
        appointmentTime: newAppt.appointmentTime,
        tokenNumber: this.appointments.length + 1,
        status: 'PENDING',
        reason: newAppt.reason,
      };
      this.appointments.push(appt);
      return of(new HttpResponse({ status: 200, body: { success: true, data: appt } })).pipe(delay(500));
    }

    // GET /hms/appointments/{id}
    if (url.match(/\/hms\/appointments\/[\w-]+$/) && method === 'GET') {
      const id = url.split('/').pop();
      const appt = this.appointments.find(a => a.id === id);
      if (appt) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: appt } })).pipe(delay(300));
      }
    }

    // GET /hms/appointments — broad list
    if (url.includes('/hms/appointments') && method === 'GET') {
      let filtered = [...this.appointments];
      const params = new URLSearchParams(fullUrl.split('?')[1] || '');
      const status = params.get('status');
      const doctorId = params.get('doctorId');
      if (status) filtered = filtered.filter(a => a.status === status);
      if (doctorId) filtered = filtered.filter(a => a.doctor?.id === doctorId);
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: filtered, totalElements: filtered.length } } })).pipe(delay(300));
    }

    // PUT /hms/appointments/{id}/approve
    if (url.includes('/hms/appointments') && url.includes('/approve') && method === 'PUT') {
      const id = this.extractId(url, 2);
      const appt = this.appointments.find(a => a.id === id);
      if (appt) { appt.status = 'APPROVED'; }
      return of(new HttpResponse({ status: 200, body: { success: true, data: appt } })).pipe(delay(300));
    }

    // PUT /hms/appointments/{id}/reject
    if (url.includes('/hms/appointments') && url.includes('/reject') && method === 'PUT') {
      const id = this.extractId(url, 2);
      const appt = this.appointments.find(a => a.id === id);
      if (appt) { appt.status = 'REJECTED'; }
      return of(new HttpResponse({ status: 200, body: { success: true, data: appt } })).pipe(delay(300));
    }

    // ─── Consultations ──────────────────────────────────────────────
    if (url.includes('/hms/consultations/appointment/') && method === 'GET') {
      const apptId = url.split('/').pop();
      const consultation = this.consultations.find(c => c.appointmentId === apptId);
      return of(new HttpResponse({ status: 200, body: { success: true, data: consultation } })).pipe(delay(300));
    }

    if (url.includes('/hms/consultations') && method === 'POST') {
      const req = body as { appointmentId: string; patientId?: string; doctorId?: string; chiefComplaints?: string; examinationFindings?: string; diagnosis?: string; clinicalNotes?: string; vitals?: Consultation['vitals'] };
      const consultation: Consultation = {
        id: Math.random().toString(36).substr(2, 9),
        appointmentId: req.appointmentId,
        patientId: req.patientId || '',
        doctorId: req.doctorId || '',
        chiefComplaints: req.chiefComplaints || '',
        examinationFindings: req.examinationFindings,
        diagnosis: req.diagnosis,
        clinicalNotes: req.clinicalNotes,
        vitals: req.vitals,
        createdAt: new Date().toISOString(),
      };
      this.consultations.push(consultation);
      return of(new HttpResponse({ status: 200, body: { success: true, data: consultation } })).pipe(delay(400));
    }

    // PUT /hms/consultations/{id}
    if (url.match(/\/hms\/consultations\/[\w-]+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const idx = this.consultations.findIndex(c => c.id === id);
      if (idx >= 0) {
        this.consultations[idx] = { ...this.consultations[idx], ...(body as Partial<Consultation>) };
        return of(new HttpResponse({ status: 200, body: { success: true, data: this.consultations[idx] } })).pipe(delay(300));
      }
    }

    // POST /hms/consultations/{appointmentId}/vitals
    if (url.match(/\/hms\/consultations\/[\w-]+\/vitals/) && method === 'POST') {
      const appointmentId = this.extractId(url, 2);
      const existing = this.consultations.find(c => c.appointmentId === appointmentId);
      if (existing) {
        existing.vitals = body as Consultation['vitals'];
      }
      return of(new HttpResponse({ status: 200, body: { success: true, data: existing } })).pipe(delay(300));
    }

    // ─── Prescriptions ──────────────────────────────────────────────
    if (url.includes('/hms/prescriptions/patient/') && method === 'GET') {
      const patientId = url.split('/').pop();
      return of(new HttpResponse({ status: 200, body: { success: true, data: this.prescriptions.filter(p => p.patient?.id === patientId) } })).pipe(delay(300));
    }

    // GET /hms/prescriptions/{id} — specific before broad
    if (url.match(/\/hms\/prescriptions\/[\w-]+$/) && method === 'GET' && !url.includes('patient') && !url.includes('pdf')) {
      const id = url.split('/').pop();
      const prescription = this.prescriptions.find(p => p.id === id);
      if (prescription) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: prescription } })).pipe(delay(300));
      }
    }

    // GET /hms/prescriptions — broad list
    if (url.includes('/hms/prescriptions') && method === 'GET' && !url.includes('patient') && !url.includes('pdf')) {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: this.prescriptions, totalElements: this.prescriptions.length } } })).pipe(delay(300));
    }

    if (url.includes('/hms/prescriptions') && method === 'POST') {
      const req = body as { consultationId: string; patientId?: string; doctorId?: string; medicines?: Prescription['medicines']; notes?: string };
      const prescription: Prescription = {
        id: 'rx-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        consultationId: req.consultationId,
        patient: { id: req.patientId || '', fullName: this.patients.find(p => p.id === req.patientId)?.fullName || 'Unknown' },
        doctor: { id: req.doctorId || '', fullName: this.doctors.find(d => d.id === req.doctorId)?.fullName || 'Unknown' },
        medicines: req.medicines || [],
        notes: req.notes,
        createdAt: new Date().toISOString(),
      };
      this.prescriptions.push(prescription);
      return of(new HttpResponse({ status: 200, body: { success: true, data: prescription } })).pipe(delay(400));
    }

    // GET /hms/prescriptions/{id}/pdf — blob response
    if (url.includes('/hms/prescriptions') && url.includes('/pdf') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: new ArrayBuffer(0), headers: request.headers.set('Content-Type', 'application/pdf') })).pipe(delay(500));
    }

    // ─── Billing ────────────────────────────────────────────────────
    // GET /hms/bills/preview
    if (url.includes('/hms/bills/preview') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { consultationFeeInPaisa: 50000, medicineChargesInPaisa: 2500, totalAmountInPaisa: 52500 } } })).pipe(delay(300));
    }

    // GET /hms/bills/{id} — specific before broad
    if (url.match(/\/hms\/bills\/[\w-]+$/) && method === 'GET' && !url.includes('preview') && !url.includes('pdf')) {
      const id = url.split('/').pop();
      const bill = this.bills.find(b => b.id === id);
      if (bill) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: bill } })).pipe(delay(300));
      }
    }

    // GET /hms/bills — broad list
    if (url.includes('/hms/bills') && method === 'GET' && !url.includes('preview') && !url.includes('pdf')) {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: this.bills, totalElements: this.bills.length } } })).pipe(delay(300));
    }

    if (url.includes('/hms/bills') && method === 'POST') {
      const req = body as { prescriptionId?: string; additionalChargesInPaisa?: number; discountInPaisa?: number; taxInPaisa?: number };
      const bill: Bill = {
        id: 'b-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        appointmentId: '',
        patient: { id: '1', fullName: 'Patient' },
        consultationFeeInPaisa: 0,
        discountInPaisa: req.discountInPaisa || 0,
        taxInPaisa: req.taxInPaisa || 0,
        totalAmountInPaisa: 0,
        paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(),
      };
      this.bills.push(bill);
      return of(new HttpResponse({ status: 200, body: { success: true, data: bill } })).pipe(delay(400));
    }

    // PUT /hms/bills/{id} — update bill
    if (url.match(/\/hms\/bills\/[\w-]+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const bill = this.bills.find(b => b.id === id);
      if (bill && body) {
        const req = body as { additionalChargesInPaisa?: number; discountInPaisa?: number; taxInPaisa?: number };
        if (req.discountInPaisa !== undefined) bill.discountInPaisa = req.discountInPaisa;
        if (req.taxInPaisa !== undefined) bill.taxInPaisa = req.taxInPaisa;
      }
      return of(new HttpResponse({ status: 200, body: { success: true, data: bill } })).pipe(delay(300));
    }

    // GET /hms/bills/{id}/pdf — blob response
    if (url.includes('/hms/bills') && url.includes('/pdf') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: new ArrayBuffer(0), headers: request.headers.set('Content-Type', 'application/pdf') })).pipe(delay(500));
    }

    // ─── Medicines ──────────────────────────────────────────────────
    if (url.includes('/hms/medicines/search') && method === 'GET') {
      const query = fullUrl.split('?q=')[1]?.toLowerCase() || '';
      const results = this.medicines.filter(m => m.medicineName.toLowerCase().includes(query) || m.genericName.toLowerCase().includes(query));
      return of(new HttpResponse({ status: 200, body: { success: true, data: results } })).pipe(delay(200));
    }

    // GET /hms/medicines/{id}
    if (url.match(/\/hms\/medicines\/[\w-]+$/) && method === 'GET' && !url.includes('search')) {
      const id = url.split('/').pop();
      const medicine = this.medicines.find(m => m.id === id);
      if (medicine) {
        return of(new HttpResponse({ status: 200, body: { success: true, data: medicine } })).pipe(delay(300));
      }
    }

    if (url.includes('/hms/medicines') && method === 'GET' && !url.includes('search')) {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: this.medicines, totalElements: this.medicines.length } } })).pipe(delay(300));
    }

    if (url.includes('/hms/medicines') && method === 'POST') {
      const med = body as Partial<Medicine>;
      const newMed: Medicine = { id: 'm' + (this.medicines.length + 1), medicineName: med.medicineName || '', genericName: med.genericName || '', manufacturer: med.manufacturer || '', category: med.category || '', unit: med.unit || 'tablet', priceInPaisa: med.priceInPaisa || 0, quantity: med.quantity || 0, isDiscontinued: false, createdAt: new Date().toISOString() };
      this.medicines.push(newMed);
      return of(new HttpResponse({ status: 200, body: { success: true, data: newMed } })).pipe(delay(400));
    }

    // PUT /hms/medicines/{id}
    if (url.match(/\/hms\/medicines\/[\w-]+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const idx = this.medicines.findIndex(m => m.id === id);
      if (idx >= 0) {
        this.medicines[idx] = { ...this.medicines[idx], ...(body as Partial<Medicine>) };
        return of(new HttpResponse({ status: 200, body: { success: true, data: this.medicines[idx] } })).pipe(delay(300));
      }
    }

    // PATCH /hms/medicines/{id}/deactivate
    if (url.match(/\/hms\/medicines\/[\w-]+\/deactivate/) && method === 'PATCH') {
      const id = this.extractId(url, 2);
      const medicine = this.medicines.find(m => m.id === id);
      if (medicine) { medicine.isDiscontinued = true; }
      return of(new HttpResponse({ status: 200, body: { success: true, data: medicine } })).pipe(delay(300));
    }

    // ─── User Management ────────────────────────────────────────────
    if (url.match(/\/hms\/users\/[\w-]+\/deactivate/) && method === 'PATCH') {
      const id = this.extractId(url, 2);
      const user = this.users.find(u => u.id === id);
      return of(new HttpResponse({ status: 200, body: { success: true, data: user } })).pipe(delay(300));
    }

    if (url.match(/\/hms\/users\/[\w-]+\/activate/) && method === 'PATCH') {
      const id = this.extractId(url, 2);
      const user = this.users.find(u => u.id === id);
      return of(new HttpResponse({ status: 200, body: { success: true, data: user } })).pipe(delay(300));
    }

    if (url.match(/\/hms\/users\/[\w-]+\/reset-password/) && method === 'POST') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { temporaryPassword: 'Temp@123' } } })).pipe(delay(300));
    }

    if (url.match(/\/hms\/users\/[\w-]+$/) && method === 'GET') {
      const id = url.split('/').pop();
      const user = this.users.find(u => u.id === id);
      return of(new HttpResponse({ status: 200, body: { success: true, data: user } })).pipe(delay(300));
    }

    if (url.includes('/hms/users') && method === 'POST') {
      const newUser = { ...(body as Partial<User>), id: 'u' + (this.users.length + 1) };
      this.users.push(newUser as User);
      return of(new HttpResponse({ status: 200, body: { success: true, data: newUser } })).pipe(delay(300));
    }

    if (url.includes('/hms/users') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: this.users, totalElements: this.users.length } } })).pipe(delay(300));
    }

    // ─── Audit Logs ─────────────────────────────────────────────────
    if (url.includes('/hms/audit-logs') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: { content: [
        { id: 'log-1', tenantId: 't1', userId: 'u1', action: 'LOGIN', entity: 'User', entityId: 'u1', timestamp: new Date().toISOString(), ipAddress: '127.0.0.1' },
        { id: 'log-2', tenantId: 't1', userId: 'u1', action: 'CREATE', entity: 'Patient', entityId: '1', oldValue: null, newValue: '{"fullName":"Rahul Sharma"}', timestamp: new Date(Date.now() - 3600000).toISOString(), ipAddress: '127.0.0.1' },
      ], totalElements: 2 } } })).pipe(delay(300));
    }

    // ─── Reports ────────────────────────────────────────────────────
    if (url.includes('/hms/reports/dashboard') && method === 'GET') {
      const stats: DashboardStats = {
        totalPatients: this.patients.length,
        todayAppointments: this.appointments.filter(a => a.appointmentDate === new Date().toISOString().split('T')[0]).length || 3,
        pendingBills: this.bills.filter(b => b.paymentStatus === 'UNPAID').length,
        totalRevenueInPaisa: this.bills.filter(b => b.paymentStatus === 'PAID').reduce((s, b) => s + b.totalAmountInPaisa, 0),
        activeDoctors: this.doctors.filter(d => d.isActive).length,
      };
      return of(new HttpResponse({ status: 200, body: { success: true, data: stats } })).pipe(delay(300));
    }

    if (url.includes('/hms/reports/appointment-trends') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: [
        { month: 'Jan', count: 65 }, { month: 'Feb', count: 72 }, { month: 'Mar', count: 58 },
        { month: 'Apr', count: 80 }, { month: 'May', count: 95 }, { month: 'Jun', count: 88 },
      ] } })).pipe(delay(300));
    }

    if (url.includes('/hms/reports/revenue') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: {
        totalBilledInPaisa: 94400, totalCollectedInPaisa: 52500, outstandingInPaisa: 41900,
        monthlyBreakdown: [
          { month: 'Apr', billed: 30000, collected: 30000 },
          { month: 'May', billed: 40000, collected: 22500 },
          { month: 'Jun', billed: 24400, collected: 0 },
        ],
      } } })).pipe(delay(300));
    }

    if (url.includes('/hms/reports/doctor-performance') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: [
        { doctorId: 'd1', doctorName: 'Dr. Anita Desai', consultationCount: 145, revenueInPaisa: 72500 },
        { doctorId: 'd2', doctorName: 'Dr. Vivek Kumar', consultationCount: 198, revenueInPaisa: 59400 },
      ] } })).pipe(delay(300));
    }

    // ─── Settings ───────────────────────────────────────────────────
    if (url.includes('/hms/settings') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: this.settings } })).pipe(delay(300));
    }

    if (url.includes('/hms/settings') && method === 'PUT') {
      this.settings = { ...this.settings, ...(body as Partial<ClinicSettings>) };
      return of(new HttpResponse({ status: 200, body: { success: true, data: this.settings } })).pipe(delay(300));
    }

    // ─── Internal License ───────────────────────────────────────────
    if (url.includes('/hms/license/effective') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { success: true, data: {
        tenantId: 't1',
        planName: 'Clinic Standard',
        planCode: 'CLINIC_STD',
        status: 'ACTIVE',
        effectiveProducts: [{ productCode: 'HMS', productName: 'Hospital Management System', isActive: true }],
        effectiveModules: [
          { moduleCode: 'PATIENT', moduleName: 'Patient Management', isCore: true, source: 'CORE', status: 'ACTIVE' },
          { moduleCode: 'APPOINTMENT', moduleName: 'Appointment Lifecycle', isCore: true, source: 'CORE', status: 'ACTIVE' },
          { moduleCode: 'DOCTOR', moduleName: 'Doctor Management', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'CONSULTATION', moduleName: 'Consultation', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'PRESCRIPTION', moduleName: 'Prescription', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'BILLING', moduleName: 'Billing & Invoice', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'PAYMENT', moduleName: 'Payment', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'MEDICINE', moduleName: 'Medicine Catalog', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'REPORTS', moduleName: 'Reports & Dashboard', isCore: false, source: 'PLAN', status: 'ACTIVE' },
          { moduleCode: 'DASHBOARD', moduleName: 'Dashboard', isCore: true, source: 'CORE', status: 'ACTIVE' },
          { moduleCode: 'SETTINGS', moduleName: 'Settings', isCore: true, source: 'CORE', status: 'ACTIVE' },
        ],
        effectiveConstraints: [
          { resourceCode: 'USER', resourceName: 'Total Users', limit: 20, currentUsage: 5, isUnlimited: false },
          { resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 5, currentUsage: 4, isUnlimited: false },
          { resourceCode: 'PATIENT', resourceName: 'Patients', limit: 0, currentUsage: 3, isUnlimited: true },
          { resourceCode: 'STORAGE_GB', resourceName: 'Storage', limit: 20, currentUsage: 2, isUnlimited: false },
        ],
        effectiveFeatures: [
          { featureCode: 'CSV_IMPORT', featureName: 'CSV Bulk Import', isEnabled: true, source: 'PLAN' },
          { featureCode: 'PDF_EXPORT', featureName: 'PDF Export', isEnabled: true, source: 'PLAN' },
        ],
        purchasedAddons: [],
        trialEndsAt: null,
        subscriptionEndsAt: '2027-07-01'
      } } })).pipe(delay(200));
    }

    // GET /hms/license/usage/{resourceCode}
    if (url.match(/\/hms\/internal\/license\/usage\/\w+/) && method === 'GET') {
      const resourceCode = url.split('/').pop();
      const usageMap: Record<string, { resourceName: string; limit: number; currentUsage: number; isUnlimited: boolean }> = {
        USER: { resourceName: 'Total Users', limit: 20, currentUsage: 5, isUnlimited: false },
        DOCTOR: { resourceName: 'Doctors', limit: 5, currentUsage: 4, isUnlimited: false },
        PATIENT: { resourceName: 'Patients', limit: 0, currentUsage: 3, isUnlimited: true },
      };
      const usage = usageMap[resourceCode || ''] || { resourceName: 'Unknown', limit: 0, currentUsage: 0, isUnlimited: false };
      return of(new HttpResponse({ status: 200, body: { success: true, data: usage } })).pipe(delay(200));
    }

    return next.handle(request);
  }
}
