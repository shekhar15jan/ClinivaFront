---
id: clin.ot.book-and-run
product: CLIN
roles: [doctor, nurse, admin]
task: Theatre
screens: [ot, ot/book, ot/surgery, patients/detail]
plan_modules: [OT]
media: []
verified_on: 2026-10-31
---

# Book a surgery and run it safely

A surgery moves through statuses: **Booked**, then **In surgery**, then **Over**. The safety checklist drives the changes, so nobody can skip a step.

## Add your theatres (once)

1. Open **Theatre** (OT) in the menu.
2. Type a name such as `OT 1` in the new-theatre box and press **Add**. It appears in the list.

## Book a surgery

1. Open the patient and press **Book surgery**.
2. Choose the **Surgeon**, type the **Procedure**, choose the **Start** date and time, and enter the **Surgeon fee**.
   Anaesthesia type and other fees are also on this form.
3. Press **Book**. The status shows **Booked**.

## Run the checklist

Press the steps in order. Each one is greyed out until the one before it is done.

| Step | When | Effect |
|---|---|---|
| **Consent** | Signed consent is on file | Marked done |
| **Sign in** | Before anaesthesia: identity, site, allergies | Marked done |
| **Time out** | Before incision: team confirms | Status becomes **In surgery** |
| **Sign out** | Counts and specimens, after the note | Status becomes **Over** |

## Write the operation note

1. While the surgery is **In surgery**, press **Write note**.
2. Fill **Findings**, **Procedure done**, **Complications** (leave blank for none), **Blood loss (ml)**, **Implants** and **Post-operative orders**.
3. Press **Save note**. **Sign out** stays disabled until the note is saved.

## Bill the surgery

When the surgery is **Over**, press the bill button in **Fees**. It then shows **Billed: BILL-…**, with a link to **Billing**.

## Common problems

- **"Sign out is greyed out."** Save the operation note first.
- **"The checklist buttons are disabled."** Do the earlier step first, and your role needs the permission to record surgery.
- **"Theatre is not in the menu."** Your clinic's plan must include the **Operation theatre** module.
