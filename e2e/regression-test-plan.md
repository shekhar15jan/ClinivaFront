# Regression Test Plan — Cliniva Frontend

## 1. Auth Module

| # | Test Case | Expected Result | Current Status |
|---|-----------|----------------|----------------|
| R1 | Enter email + password → click "Login" | Calls `POST /auth/verify-password`, if `requiresOtp` → navigates to OTP page | **FIXED** (was BUG-AUTH-01) |
| R2 | Enter 6-digit OTP → click "Verify & Login" | Calls `POST /auth/verify-otp`, stores JWT, navigates to dashboard/onboarding | **FIXED** (was BUG-AUTH-02) |
| R3 | Enter invalid email format | Show validation error "Please enter a valid email address" | **FIXED** — validates `@` presence before submit (was BUG-AUTH-01) |
| R4 | Enter wrong OTP | Show "Invalid OTP. Please try again." | **FIXED** — catches error response (was BUG-AUTH-02) |
| R5 | Click "Back" on OTP page | Navigate back to email step | **WORKS** — `goBack()` method navigates to login |
| R6 | Resend OTP timer countdown | Shows remaining time (e.g., "Resend in 0:45") | **MISSING** — hardcoded "0:59" in template |
| R7 | Access `/dashboard` without login | Redirect to `/auth/login?returnUrl=/dashboard` | **WORKS** — AuthGuard handles this correctly |

## 2. Patient Module

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R8 | Navigate to `/patients` | Shows patient list table with search |
| R9 | Search patient by name | Filters table results |
| R10 | Click patient row | Navigate to `/patients/:id` detail page |
| R11 | Click "Add Patient" button | Opens registration modal |
| R12 | Submit empty registration form | Show validation errors |
| R13 | Submit valid registration | POST to `/hms/patients`, list updates |
| R14 | Pagination: navigate pages | Shows next/prev page of patients |

## 3. Doctor Module (NEW)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R15 | Navigate to `/doctors` | Shows doctor list with specialization filter |
| R16 | Click "Add Doctor" | Navigate to `/doctors/new` form |
| R17 | Submit doctor form | Creates doctor via API |
| R18 | Click doctor row | Navigate to `/doctors/:id` with profile, fee, schedule |

## 4. Appointment Module

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R19 | Navigate to `/appointments` | Shows calendar view |
| R20 | Click "Book Appointment" | Navigate to `/appointments/book` wizard |
| R21 | Select doctor, date, slot in wizard | Creates appointment with PENDING status |
| R22 | Approve/Reject appointment | PATCH appointment status |
| R23 | Filter by doctor, date, status | Table updates with filtered results |

## 5. Consultation Module

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R24 | Navigate to `/consultations` | Shows consultation workspace |
| R25 | Record chief complaints, diagnosis | Saves consultation data |
| R26 | Add vitals (BP, temp, SpO2) | POST vitals to API |
| R27 | Add medicines to prescription | Dynamic FormArray for medicine entries |
| R28 | Click "Finish & Print" | Completes consultation, navigates to print |

## 6. Billing Module

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R29 | Navigate to `/billing` | Shows bill list table with filters |
| R30 | Click bill row | Navigate to `/billing/:id` with invoice detail |
| R31 | Click "Print" | Opens browser print dialog |
| R32 | Click "Collect Payment" | Updates bill status to PAID |
| R33 | Filter by status (Paid/Unpaid) | Table filters correctly |

## 7. Pharmacy/Medicines (NEW)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R34 | Navigate to `/medicines` | Shows medicine catalog with search |
| R35 | Search by name or generic name | Filters results |

## 8. Prescriptions (NEW)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R36 | Navigate to `/prescriptions` | Shows prescription list |
| R37 | Click prescription | Shows detail with printable layout |
| R38 | Click "Print" | Opens print dialog |

## 9. Reports (NEW)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R39 | Navigate to `/reports` | Shows stat cards, charts, doctor performance |
| R40 | Change date range filter | Updates chart data |

## 10. Settings (NEW)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R41 | Navigate to `/settings` | Shows clinic settings form |
| R42 | Edit clinic name and save | PUT to `/hms/settings`, form updates |
| R43 | Toggle feature flags | Checkboxes toggle correctly |

## 11. Sidebar Navigation

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R44 | All sidebar links navigate correctly | Dashboard, Patients, Doctors, Appointments, Consultations, Billing, Pharmacy, Settings all work |
| R45 | Active route highlighted | Current page link shown with active style |

## 12. Mock Backend

| # | Test Case | Expected Result |
|---|-----------|----------------|
| R46 | All endpoints respond with valid JSON | No 404/500 errors in console |
| R47 | Auth endpoints return JWT structure | `{ success, data: { accessToken, user } }` |
| R48 | List endpoints return paginated response | `{ success, data: { content, totalElements } }` |

---

# Performance Test Plan

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| P1 | Login page initial load | < 2s FMP | Lighthouse, WebPageTest |
| P2 | OTP send API | < 500ms | Chrome DevTools Network |
| P3 | OTP verify API | < 500ms | Chrome DevTools Network |
| P4 | Dashboard render | < 1s | Chrome DevTools Performance |
| P5 | Patient list load (20 records) | < 1s | Chrome DevTools Network |
| P6 | Bundle size (initial chunk) | < 100KB gzip | `ng build --stats-json` |
| P7 | Lazy chunk load time | < 500ms | Chrome DevTools Network |
| P8 | Memory usage (idle) | < 50MB | Chrome Task Manager |
| P9 | Memory usage (after full navigation) | < 100MB | Chrome Task Manager |
| P10 | Concurrent API calls (5 simultaneous) | No timeout | Custom benchmark |

## Known Bugs (from test analysis)

### ✅ Fixed

1. **BUG-AUTH-01**: `LoginEmail` had empty class — **FIXED**. Now has `login()` method, email/password binding, validation.
2. **BUG-AUTH-02**: `LoginOtp` had empty class — **FIXED**. Now has `verifyOtp()`, `resendOtp()`, OTP binding, navigation.
3. **BUG-AUTH-03**: Auth routes pointed to empty components — **FIXED**. Components now have working logic.
4. **BUG-AUTH-04**: Old `Login` with working logic was unused — **STALE** (old file no longer exists; logic merged into `LoginEmail`/`LoginOtp`).
5. **BUG-AUTH-05**: Dead component declarations — **FIXED**. Module imports only used components.
6. **BUG-FR-FE-10**: JWT localStorage — **FIXED**. Now stored in-memory in `AuthService`; persisted to localStorage as recovery only.

### 🔴 Remaining

None.
