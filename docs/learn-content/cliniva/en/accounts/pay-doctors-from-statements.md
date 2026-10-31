---
id: clin.payouts.statements
product: CLIN
roles: [accountant, admin, doctor]
task: Doctor payouts
screens: [payouts, payouts/:id, my-payouts]
plan_modules: [PAYOUT]
media: []
verified_on: 2026-10-31
---

# Pay doctors from payout statements

A **payout statement** lists what a doctor has earned in a period, from rules you set once per doctor. You draft it, add anything extra, approve it, then mark it paid. The doctor sees it under **My payouts** once it is approved.

| Status | Meaning | What you can do |
|---|---|---|
| **Drafts** | Made, still editable | Add or remove lines, change TDS, **Approve**, **Cancel** |
| **To pay** (approved) | Locked, waiting for payment | **Mark paid**, **PDF**, **Cancel** |
| **Paid** | Money sent | **PDF** |

## Set each doctor's rules (once)

Who: the accountant (the *Doctor payouts* permission).

1. Open **Doctor payouts** and press the **Rules** tab.
2. Find the doctor and press **Set rules**.
3. For each of the four sources choose **Nothing**, **Share %** or **Fixed amount**, then type the number:
   - **Consultations (paid bills)**
   - **Inpatient visits**
   - **Surgeries as surgeon**
   - **Anaesthesia**
4. Press **Save rules**. The summary under the doctor's name shows the rule. Press **Cancel** to leave without saving.

*Share %* is a share of the fee. *Fixed amount* is an amount **per item** (per consultation, visit or surgery).

## Draft a statement

1. Open **Doctor payouts**, then the **Statements** tab.
2. In **New statement** pick the **Doctor**, then press **Last month** or **This month so far** (or set **From** and **To** dates).
3. Press **Draft statement**. The new statement opens.

Only **paid** bills count, so collect the money first (see *Bill a visit and take payment*).

## Check and adjust the draft

The statement shows **Gross**, **TDS** and **Net**, and a line for each earning, with the fee it came from.

- Anything missing or extra: type a description (for example *On-call allowance* or *Advance recovered*), type the amount, choose **Addition** or **Deduction**, press **Add**. Press **Remove** next to a line to take it out.
- **TDS:** choose **0%** or **10%**. Gross, TDS and Net update.

## Approve and pay

1. Press **Approve**. The statement is locked and the doctor can see it.
2. Choose the method: **Bank transfer**, **UPI**, **Cheque** or **Cash**. Type the **UTR / cheque no.** in the reference box.
3. Press **Mark paid**. The header shows when it was paid, the method and the reference.
4. Press **PDF** to download the statement for the doctor.

To drop a statement press **Cancel** (drafts and approved ones only) and answer the question *Why cancel this statement?*; the header then shows *Cancelled: reason*.

## Month-end export

On the Statements tab set **From** and **To** and press **Export CSV for the period**. Use the filter buttons **Drafts**, **To pay**, **Paid**, **All** to find statements.

## For the doctor

Open **My payouts**. Each approved statement shows the period, the net amount and *approved, to be paid* or *paid*. Tap one to see its lines. Until the hospital approves one, the page says *No statements yet.*

## Check your work

- Net equals Gross minus TDS.
- After **Mark paid** the card moves to the **Paid** filter, and the doctor's card says *paid*.
