---
id: clin.admin.set-up-clinic
product: CLIN
roles: [admin]
task: Set up
screens: [dashboard, doctors, users, settings]
plan_modules: [DOCTOR, USER, SETTINGS]
media: []
verified_on: 2026-10-30
---

# Set up your clinic

Do this once, in this order. It takes about 15 minutes.

## 1. First sign-in

1. Open the sign-in address in your welcome email. It looks like `/cliniva/<your-clinic-code>/login`.
2. The email also carries a **temporary password**. On the first visit you are asked to **change your password**: enter your email, the temporary password, then a new password (at least 8 characters) twice, and press **Change Password**.
3. Sign in with your email and new password. Cliniva then emails you a **6-digit sign-in code**. Type it in. You need a code every time you sign in.

## 2. Add your doctors

1. Open **Doctors** and press **Add Doctor**.
2. Fill in the **Doctor Registration** form: full name, specialization, qualification, years of experience, phone, email and consultation fee.
3. Press **Save Doctor**. The button stays grey until the required details are filled in.
4. The doctor's **email creates their login**: they get a welcome email with a temporary password, like you did.

## 3. Set each doctor's weekly hours

Patients cannot be booked for a doctor who has no hours.

1. Open **Doctors**, then **View** the doctor's name.
2. Under **Weekly Schedule**, tick the days the doctor is available and set the start and end time for each.
3. Save. Reload the page to check the hours are kept.

## 4. Add your staff

1. Open **Users** and add each person with their name, email and **role** (for example receptionist, nurse, pharmacist, billing).
2. They receive a temporary password by email and set their own password at first sign-in.
3. What each person sees follows their role, and also your plan: a menu item that is not in your plan is not shown, and typing its address sends the person back to the dashboard with the message "not available in your current plan".

Clinics on a plan with **Roles** can also build custom roles from the **Roles** menu.

## 5. Check Settings

Open **Settings** to check the clinic name and contact details that appear on bills and prescriptions. **Email Templates** (under Settings) lets you reword the emails patients receive.

## Next

- Front desk: [Register a patient](../receptionist/register-a-patient.md) and [Book and approve an appointment](../receptionist/book-and-approve-an-appointment.md).
- Doctors: [Run a consultation](../doctor/run-a-consultation.md).

## Common problems

- **"I did not get the sign-in code."** Wait a minute, check spam, then press **Resend OTP** on the code screen.
- **"I cannot book a doctor."** The doctor has no weekly hours yet (step 3).
- **"A menu item is missing."** It is not in your plan, or your role does not allow it. Ask the clinic administrator.
