---
id: clin.radiology.order-to-report
product: CLIN
roles: [doctor, receptionist, radiologist, admin]
task: Radiology
screens: [radiology, radiology/studies, patients/detail]
plan_modules: [RADIOLOGY]
media: []
verified_on: 2026-10-31
---

# Order an imaging study and sign the report

An imaging order shows its status: **To do**, then **In progress**, then **Reported** (or **Cancelled**).

| Step | Who | What |
|---|---|---|
| Order | Doctor or anyone with *Order imaging* | Choose the studies for a patient |
| Bill | Billing desk | Make the bill for the studies |
| Do the study | Radiology staff | Mark it done, with the image link |
| Report | Radiologist with *Report imaging* | Write findings and sign |

## Set up the study catalog (once, by the clinic administrator)

1. Open **Radiology**, then press **Study catalog**.
2. Press **Add common studies**, or **Add study** for your own.
3. Set the **Code**, **Name**, **Price**, **Modality**, **Body part** and **Preparation** (what the patient must do before the scan).
4. For an obstetric scan tick **Obstetric scan: Form F (PCPNDT) needed**. Such a study cannot be marked done without a Form F number.

## Order imaging for a patient

1. Open the patient and press **Order imaging**.
2. Tap the studies you want, add a note if useful, and save the order.
3. The order opens as **To do**.

## Bill the order

Press the bill button on the order. The header then shows **Billed: BILL-…** with a link to **Billing**.

## Do the study and write the report

1. Press **Mark done**. Fill the **Image link**, the **Time for the study**, the **Form F number** (obstetric scans) and a **Note for the radiologist**, then press **Study done**.
2. The radiologist presses **Write report**, types the **Findings** and the **Impression**, and presses **Sign report**.
   Signing makes the report final. Anything later goes in an addendum.
3. The order shows **Reported**. Press **Report** to open or print it.
4. To add something after signing, press **Add addendum**, type it and press **Add addendum**.

## Where to find work

Open **Radiology**: **urgent orders come first**. Use the filters **To do** and **Reported**.

## Common problems

- **"Radiology is not in the menu" or access denied.** Your clinic's plan must include the **Radiology** module.
- **"I cannot sign the report."** Your role needs *Report imaging*; ordering and reporting are separate permissions.
- **"Study done is refused on a scan."** An obstetric scan needs its Form F number.
