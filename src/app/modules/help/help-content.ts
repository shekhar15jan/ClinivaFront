import { NavItem, STAFF_NAV, canSee } from '../../layout/nav-items';

/**
 * The in-app Help: short articles written in plain words, condensed from the user guides in docs/learn-content/cliniva (CLIN-11).
 * Static on purpose: Help must work with no network, which is when staff most need it.
 */
export interface HelpArticle {
  id: string;
  title: string;
  /** What the article is about, in one line. */
  summary: string;
  icon: string;
  /** Roles it is for; 'ALL' means everyone who signs in. */
  roles: string[];
  steps: string[];
  tip?: string;
}

const ADMINS = ['ADMIN', 'HOSPITAL_ADMIN'];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'sign-in-and-safety', title: 'Signing in and staying safe', icon: 'lock', roles: ['ALL'],
    summary: 'The six-digit code, and why you are signed out when you step away.',
    steps: [
      'Sign in with your email and password. Cliniva then emails you a 6-digit code. Type it in.',
      'If you do nothing for 15 minutes you are signed out, so a patient record never stays open on a shared desk. A minute before, a warning counts down. Touch the screen to stay.',
      'Press Logout when you finish on a shared device.',
    ],
    tip: 'Forgot your password? Ask your clinic administrator to reset it.',
  },
  {
    id: 'register-patient', title: 'Register a patient', icon: 'person_add', roles: ['RECEPTIONIST', ...ADMINS],
    summary: 'Add a new patient in a minute.',
    steps: [
      'Open Patients and press Add Patient.',
      'Fill in name, phone, gender and date of birth. For a child under 18, add the parent or guardian.',
      'Tick that the patient was given the clinic privacy notice. Give the notice first, then tick.',
      'Press Save Patient. If the button is grey, a required detail is missing.',
    ],
    tip: 'Search by name or phone before adding. A phone number already in the clinic means the patient exists.',
  },
  {
    id: 'book-appointment', title: 'Book and approve an appointment', icon: 'event', roles: ['RECEPTIONIST', ...ADMINS],
    summary: 'Pick a doctor, a time and a patient.',
    steps: [
      'Open Appointments and choose Book.',
      'Step 1: pick the doctor and a time, then Next Step.',
      'Step 2: find the patient and select them, then Next Step.',
      'Step 3: check the summary and press Confirm.',
      'A new booking waits for approval. Find it in the day list and press Approve so the doctor can start.',
    ],
    tip: 'No times shown? The doctor has no weekly hours yet. Set them under Doctors.',
  },
  {
    id: 'run-consultation', title: 'Run a consultation', icon: 'stethoscope', roles: ['DOCTOR'],
    summary: 'See the patient, write the note, give the prescription.',
    steps: [
      'Open Appointments and find the patient in the day list.',
      'Press Start consultation. It only appears once the front desk has approved the visit.',
      'Write the complaint and the diagnosis, and add the vitals you took.',
      'Add medicines by picking them from the clinic list, and set the days for each.',
      'Press Finish and Print. The note and the prescription are saved together.',
    ],
    tip: 'With no network the note is kept on your device and sent by itself when you are back online.',
  },
  {
    id: 'ward-round', title: 'Ward round: vitals, doses and notes', icon: 'clinical_notes', roles: ['NURSE', 'DOCTOR'],
    summary: 'The Ward round screen works on a phone.',
    steps: [
      'Open Ward round. Red means a dose is overdue, blue a dose is due, amber vitals are overdue, green nothing is waiting.',
      'Open a patient. The chart has three tabs: Medicines, Vitals and Notes.',
      'To give a dose, open Medicines, tap the time and choose Given, Held, Refused or Missed. If it was not given, write why.',
      'For vitals, fill in only the readings you took and save.',
      'For a note or a shift handover, open Notes, choose the kind and the shift, and save.',
    ],
    tip: 'Vitals and notes saved with no network are kept on the device and sent later. Doses are not: record them when the network is back.',
  },
  {
    id: 'bill-visit', title: 'Bill a visit and take payment', icon: 'request_quote', roles: ['RECEPTIONIST', 'ACCOUNTANT', ...ADMINS],
    summary: 'From the prescription to a paid invoice.',
    steps: [
      'Open Prescriptions and open the visit.',
      'Add any extra charges, a discount or tax, then press Generate Bill.',
      'On the invoice press Collect Payment and choose Cash, UPI, Card or Net banking.',
      'Cash: press Mark as Paid. Others: use Pay online now, then Confirm Payment.',
    ],
  },
  {
    id: 'medicine-stock', title: 'Manage medicine stock', icon: 'inventory_2', roles: ['PHARMACIST', ...ADMINS],
    summary: 'Receive stock in batches and watch expiry.',
    steps: [
      'Add the medicine under Pharmacy with its name and price first.',
      'Open Stock, then Receive. Choose the supplier, type the invoice number, and fill batch, expiry, quantity and cost for each line.',
      'Press Receive stock.',
      'Open the Alerts tab to see medicines to reorder and batches expiring in 60 days.',
    ],
    tip: 'Medicines are used earliest expiry first, and expired stock is never issued.',
  },
  {
    id: 'lab-report', title: 'Lab: order a test and release the report', icon: 'biotech', roles: ['LAB_TECHNICIAN', 'DOCTOR', ...ADMINS],
    summary: 'From order to a verified report.',
    steps: [
      'A doctor orders the test from the Lab screen.',
      'The technician opens the worklist, collects the sample and enters the results.',
      'A doctor verifies the result. Only then is the report released to the patient.',
    ],
  },
  {
    id: 'set-up-clinic', title: 'Set up your clinic', icon: 'settings', roles: [...ADMINS],
    summary: 'Do this once, in this order.',
    steps: [
      'First sign-in: change the temporary password from your welcome email.',
      'Add your doctors under Doctors. Their email becomes their login.',
      'Set each doctor weekly hours. Nobody can book a doctor with no hours.',
      'Add your staff under Users and give each a role.',
      'Check Settings for the clinic name and payment keys.',
    ],
  },
  {
    id: 'emergency-access', title: 'Emergency access and review', icon: 'emergency', roles: ['DOCTOR', 'NURSE', ...ADMINS],
    summary: 'Opening a patient outside your department, and who checks it.',
    steps: [
      'If you must open the record of a patient outside your department in an emergency, you give a reason first.',
      'Every such opening is listed under Emergency Access with who, which patient and why.',
      'A different person reviews each one. Your own access is always reviewed by someone else.',
    ],
    tip: 'Only open a record you need to treat. Every opening is recorded.',
  },
  {
    id: 'offline', title: 'Working with no network', icon: 'cloud_off', roles: ['DOCTOR', 'NURSE'],
    summary: 'What is kept on the device, and what is not.',
    steps: [
      'A consultation note, a vitals reading or a nursing note saved with no network is kept on your device.',
      'A bar shows how many are waiting. They are sent in order when you are back online.',
      'If the server refuses one, it stays in the list so you can retry or discard it.',
    ],
    tip: 'Keep the app open or installed until the bar says everything is sent.',
  },
  {
    id: 'patient-portal', title: 'Using your patient portal', icon: 'phone_iphone', roles: ['PATIENT'],
    summary: 'Your appointments, prescriptions and bills on your phone.',
    steps: [
      'Sign in with your email, then type the 6-digit code emailed to you.',
      'My Appointments shows what is booked and past visits. My Prescriptions shows what your doctors gave you.',
      'My Bills shows what is paid. If the clinic accepts online payment, open a bill and pay by UPI, card or net banking.',
      'Privacy shows the clinic notice and your choices. A parent or guardian makes a child choices.',
    ],
    tip: 'No code? Wait a minute, check spam, then press Resend OTP.',
  },
  {
    id: 'reports', title: 'Read reports and analytics', icon: 'bar_chart', roles: ['ACCOUNTANT', ...ADMINS],
    summary: 'Pick a period and read the totals.',
    steps: [
      'Open Reports for finance and operations summaries, or Analytics for charts.',
      'Choose the date range at the top.',
      'Tap a figure to see what it is made of.',
    ],
  },
];

/** The articles a person with this role sees, their own first. */
export function articlesFor(role: string | undefined | null): HelpArticle[] {
  const r = role ?? '';
  const mine = HELP_ARTICLES.filter((a) => a.roles.includes(r));
  const everyone = HELP_ARTICLES.filter((a) => a.roles.includes('ALL'));
  return [...mine.filter((a) => !a.roles.includes('ALL')), ...everyone];
}

/** One stop of the first-run tour. */
export interface TourStep {
  title: string;
  text: string;
  icon: string;
  /** Menu route (relative to the clinic) it points at; absent for the closing step. */
  route?: string;
}

const STAFF_TEXT: Record<string, string> = {
  patients: 'Find a patient by name or phone, register a new one, and open their visit history.',
  appointments: 'The day list: book, approve and start consultations from here.',
  consultations: 'Your past consultations and prescriptions in one place.',
  nursing: 'The ward round: who needs a dose or vitals next, coloured by urgency.',
  ipd: 'Beds and admissions: who is in which bed.',
  billing: 'Invoices, and taking payment in cash, UPI or card.',
  prescriptions: 'Prescriptions, and the place to make the bill from.',
  medicines: 'The medicine catalogue with prices.',
  stock: 'Receive stock in batches and watch expiry dates.',
  lab: 'Lab orders, results and reports.',
  radiology: 'Imaging orders and reports.',
  ot: 'Theatre bookings and surgery records.',
  doctors: 'Doctors and their weekly hours.',
  users: 'Add staff and give each a role.',
  reports: 'Finance and operations totals for any period.',
  analytics: 'Charts of how the clinic is doing.',
  insurance: 'Insurance claims and their status.',
  settings: 'Clinic details, payment keys and preferences.',
  dashboard: 'Your home screen: what needs attention today.',
};

const STAFF_ORDER: Record<string, string[]> = {
  ADMIN: ['dashboard', 'patients', 'appointments', 'users'],
  HOSPITAL_ADMIN: ['dashboard', 'patients', 'appointments', 'doctors'],
  ACCOUNTANT: ['billing', 'reports', 'analytics', 'insurance'],
  DOCTOR: ['appointments', 'consultations', 'patients', 'nursing'],
  NURSE: ['nursing', 'ipd', 'patients', 'appointments'],
  RECEPTIONIST: ['patients', 'appointments', 'billing', 'ipd'],
  PHARMACIST: ['medicines', 'stock', 'prescriptions', 'patients'],
  LAB_TECHNICIAN: ['lab', 'patients'],
};

const PATIENT_STEPS: TourStep[] = [
  { title: 'My Appointments', text: 'Your booked and past visits.', icon: 'event', route: 'patient/appointments' },
  { title: 'My Prescriptions', text: 'What your doctors gave you.', icon: 'receipt_long', route: 'patient/prescriptions' },
  { title: 'My Bills', text: 'What you owe and what is paid. You can pay online here if your clinic allows.', icon: 'payments', route: 'patient/bills' },
  { title: 'My Profile', text: 'The details the clinic holds about you.', icon: 'person', route: 'patient/profile' },
];

export const HELP_STEP: TourStep = {
  title: 'Help is always here',
  text: 'Press the question mark at the top any time. You can run this tour again from the Help page.',
  icon: 'help',
  route: 'help',
};

const SEARCH_STEP: TourStep = {
  title: 'Search at the top',
  text: 'Type a name or phone number in the search box to find a patient from any screen.',
  icon: 'search',
};

/**
 * The tour for this person: up to four stops on the menu items their role and plan really show them, then Help.
 * Always between 3 and 5 steps, and never points at a menu item the person cannot open.
 */
export function tourStepsFor(
  role: string | undefined | null,
  permissions: readonly string[],
  activeModules: readonly string[],
  nav: readonly NavItem[] = STAFF_NAV,
): TourStep[] {
  if (role === 'PATIENT') {
    return [...PATIENT_STEPS, { ...HELP_STEP, route: 'patient/help' }];
  }
  const wanted = STAFF_ORDER[role ?? ''] ?? ['dashboard', 'patients', 'appointments'];
  const visible = (route: string): NavItem | undefined => {
    const item = nav.find((n) => n.route === route);
    return item && canSee(item, permissions, activeModules) ? item : undefined;
  };
  let steps: TourStep[] = wanted.flatMap((route) => {
    const item = visible(route);
    return item ? [{ title: item.label, text: STAFF_TEXT[route] ?? `Open ${item.label} from the menu.`, icon: item.icon, route }] : [];
  });
  if (steps.length === 0) {
    // A custom role: show the first few things the menu offers them.
    steps = nav
      .filter((n) => canSee(n, permissions, activeModules))
      .slice(0, 3)
      .map((n) => ({ title: n.label, text: STAFF_TEXT[n.route] ?? `Open ${n.label} from the menu.`, icon: n.icon, route: n.route }));
  }
  const out = [...steps.slice(0, 4), HELP_STEP];
  // Three is the least that makes a tour worth running.
  if (out.length < 3) out.unshift(SEARCH_STEP);
  return out;
}
