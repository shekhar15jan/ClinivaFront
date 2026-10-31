---
id: clin.insurance.claim
product: CLIN
roles: [billing, admin]
task: Insurance
screens: [insurance, insurance/claims, ipd/admissions]
plan_modules: [INSURANCE, IPD]
media: []
verified_on: 2026-10-31
---

# Track an insurance claim for an admitted patient

For a patient with health insurance, the clinic opens a **claim** on the patient's stay and moves it along as the insurer replies. The claim's status shows where it is, and the stay's final bill shows how much the insurer will pay.

| Status | Meaning |
|---|---|
| **Draft** | Claim opened, nothing sent yet |
| **Pre-auth sent** | Estimate sent to the insurer or TPA |
| **Pre-auth approved** | Insurer approved an amount |
| **Pre-auth rejected** | Insurer refused |
| **Claim sent** | Final claim sent after discharge |
| **Settled** | Payment received |
| **Claim rejected** / **Cancelled** | Closed without payment |

## Add the insurers and TPAs (once)

1. Open **Insurance** in the menu, then the **Payers** tab.
2. Press **Add common payers** to fill the usual ones, or type a name under **New payer**, choose its **Kind** (**Insurer**, **TPA** or **Scheme**) and add it.

## Open a claim

1. Open the patient's stay (**Admissions**, then the patient) and press **Insurance**.
2. Choose the **Insurer** and, if one is involved, the **TPA**.
3. Type the **Policy or card number** and the amount to be **claimed**, then save.
4. The claim opens as **Draft**.

## Move the claim along

On the claim, press the next step shown. Only the steps that make sense for the current status are offered.

| From | Steps you can press |
|---|---|
| Draft | **Pre-auth sent** (asks for **Amount asked for**), **Cancel claim**, **Note** |
| Pre-auth sent | **Approved** (**Amount approved**), **Pre-auth rejected**, **Query from insurer**, **Cancel claim** |
| Pre-auth approved | **Claim sent** (**Amount claimed**), **Enhancement approved** (**New approved amount**), **Query from insurer** |
| Claim sent | **Payment received** (**Amount received**), **Claim rejected**, **Query from insurer** |

Every step is added to the claim's **Timeline**, with who did it and when. Use **Note** to record a phone call or a document sent.

## See it on the patient's bill

Press the stay number at the top of the claim. The stay's account shows the amount the insurer is expected to pay (for example ₹40,000 after that approval). The rest is the patient's share.

## Where the money stands

The Insurance screen shows **Insurers owe** (approved but not yet received) and **Open claims**, so the billing desk can chase what is pending.

## Common problems

- **"Insurance is not on the patient's stay."** The clinic's plan must include **Insurance** and **IPD**, and the patient must be admitted.
- **"No insurers to choose."** Add them first under **Payers**.
- **"I cannot press the step I need."** Steps depend on the status; for example **Payment received** only appears once the claim is **Claim sent**.
