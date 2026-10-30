---
id: clin.front-desk.register-patient
product: CLIN
roles: [receptionist, admin]
task: Register
screens: [patients]
plan_modules: [PATIENT]
media: []
verified_on: 2026-10-30
---

# Register a patient

## One patient

1. Open **Patients** and press **Add Patient**.
2. Fill in the details: full name, phone, email, gender and date of birth.
3. **Under 18?** The form then asks for the **parent or guardian's name** and relation (Mother, Father, Guardian): a guardian gives the consents for a child.
4. Tick that **the patient (or their guardian) was given the clinic's privacy notice**. Cliniva records this for the Digital Personal Data Protection Act, so give the notice first, then tick.
5. Press **Save Patient**. The form guards itself: if something is missing or wrong, the button stays disabled.
6. The patient appears in the list. Reload the page to see that they are kept.

A patient's page shows their visit history with the doctor who saw them. Use it to **correct** details (they are kept when you save) or to **delete** a patient: Cliniva asks you to confirm in a **Delete patient** box before anything is removed.

## Finding a patient

A clinic can have thousands of patients, so lists are found by **search**: type a name or phone number at the top of **Patients**.

## Many patients at once (CSV import)

1. On **Patients** press **Import CSV**.
2. Choose your file. Columns: name, phone, email, gender, date of birth, age, address, blood group. A patient with no age is fine.
3. Press **Upload / Import**. New patients are added and listed. A row that repeats a phone number already in the clinic is reported, not added twice.

## Common problems

- **"Save Patient is grey."** A required field is empty or invalid, the guardian is missing for a child, or the privacy notice box is not ticked.
- **"The phone number already exists."** The patient is already registered: search for them instead.
- **Your clinic only sees its own patients.** Another clinic's patients never appear in your list.

## Next

[Book and approve an appointment](book-and-approve-an-appointment.md).
