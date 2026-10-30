---
id: clin.billing.bill-visit
product: CLIN
roles: [receptionist, billing, admin]
task: Bill
screens: [prescriptions/detail, billing, payments]
plan_modules: [BILLING, PAYMENT]
media: []
verified_on: 2026-10-30
---

# Bill a visit and take payment

## Make the bill

1. After the doctor finishes, open **Prescriptions** and open that visit's prescription.
2. In the billing panel you can add **Additional charges**, a **Discount** and **Tax**, all in rupees. Leave them empty if there are none.
3. Press **Generate Bill**. The bill is made from the doctor's **consultation fee** plus the **medicines** on the prescription, plus your additional charges and tax, less the discount.
   Example: fee 600 + medicines 125 + additional 50, less discount 25 = **750**.
4. The invoice opens with the patient, the doctor and the amount. It starts as **UNPAID**.

## Take payment

1. On the invoice press **Collect Payment**.
2. Choose how the patient pays: **Cash**, **UPI**, **Card** or **Net banking**.
   - **Cash:** press **Mark as Paid**.
   - **UPI, card or net banking:** use **Pay online now**, at the desk or on the patient's phone, through the clinic's Razorpay account, then **Confirm Payment**.
3. Cliniva shows **"Payment recorded"** and the invoice changes to **PAID**. This is saved on the server: reload and it still says PAID, and there is nothing left to collect.
4. The payment also appears in the **Payments** list.

## Common problems

- **"Generate Bill is not on the prescription."** Your role needs the billing permission, and your plan must include Billing.
- **"Pay online does not appear."** The clinic has not saved its Razorpay keys in **Settings**. Cash always works.
