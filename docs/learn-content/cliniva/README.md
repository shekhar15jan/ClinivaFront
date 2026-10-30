# Cliniva user guides (CLIN-11)

One article per task, in the format fixed by `docs/plans/learn-and-support-plan.md` (Markdown with front matter; Marathi and
Hindi later in `mr/` and `hi/` with the same ids). `learn-cli` and the help centre are not built yet (LEARN epic), so these
files are plain Markdown for now.

| Role | Article |
|---|---|
| Clinic administrator | `en/admin/set-up-your-clinic.md` |
| Receptionist | `en/receptionist/register-a-patient.md`, `en/receptionist/book-and-approve-an-appointment.md` |
| Doctor | `en/doctor/run-a-consultation.md` |
| Billing | `en/billing/bill-a-visit-and-take-payment.md` |
| Nurse | `en/nurse/ward-round-vitals-and-doses.md` |
| Patient | `en/patient/use-the-patient-portal.md` |

**How these were checked:** every button, field and message name was taken from the screens' code and the live browser suite
(`Cliniva/ClinivaFront/e2e-live`) on 30 Oct 2026. Not covered yet (planned): pharmacy and stock, lab, radiology, theatre,
insurance, ABDM, payouts, reports, roles and privacy administration, and the Hindi and Marathi translations (which need a
fluent reviewer, owner decision #20).
