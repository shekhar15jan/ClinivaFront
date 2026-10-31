---
id: clin.abdm.setup-and-abha
product: CLIN
roles: [admin, receptionist, doctor]
task: ABDM
screens: [abdm, patients/detail]
plan_modules: [ABDM]
media: []
verified_on: 2026-10-31
---

# Set up ABDM and add a patient's ABHA

ABDM (Ayushman Bharat Digital Mission) lets a patient carry one health ID, the **ABHA**, and lets clinics produce health records in the national format. In Cliniva the **ABDM** menu is available only when your plan includes the ABDM module.

## What Cliniva does today, and what it does not

- It keeps your clinic's **HFR ID**, each doctor's **HPR ID**, and each patient's **ABHA number** and **ABHA address**.
- It checks every ABHA number you type, and prepares each shareable health record in the national (FHIR) format.
- It does **not** send records to the ABDM gateway until your clinic has its credentials from NHA (sandbox first). Until then the ABDM page says *Not connected to the ABDM gateway yet: records are prepared but not sent.*

## Set up the clinic (administrator)

Who: the clinic administrator (needs the *Clinic settings* permission for the facility ID, and *Doctor management* for doctors' IDs).

1. Open **ABDM** in the menu. The top box shows whether the gateway is connected.
2. Read the list under it. It tells you what is still missing, for example *Register the facility in the Health Facility Registry and enter its HFR ID*, or *2 doctor(s) without an HPR ID*.
3. Type your **Facility HFR ID** (the ID you got when the clinic was registered in the Health Facility Registry) and press **Save**. The message *HFR ID saved* appears and the reminder about the registry disappears.
4. Under **Doctors' HPR IDs**, type each doctor's HPR ID next to their name and press **Save** on that row (*HPR ID saved*).
5. The two counters, **Patients with ABHA** and **Doctors with HPR ID**, show your progress.

## Add a patient's ABHA

Who: the receptionist, the doctor or the administrator, from the patient's page.

1. Open **Patients** and tap the patient.
2. In the **ABHA (ABDM)** box press **Add ABHA** (it says **Edit** when one is already saved).
3. Type the **ABHA number (14 digits)**. Spaces or dashes are fine; Cliniva shows it as `91-1234-5678-9012`.
4. Optionally type the **ABHA address**, for example `name@abdm`.
5. Press **Save**. The message *ABHA saved* appears and the box shows the number and the address.

### If Cliniva refuses the number

| Message | Meaning | What to do |
|---|---|---|
| *That is not a valid ABHA number: 14 digits, the last a check digit.* | A digit is wrong or missing. The last digit is a check digit, so one typing slip is caught. | Read the number again from the patient's card or app and retype it. |
| *Another patient has this ABHA number.* | The same number is already on a different patient in your clinic. | Search for the patient; it may be a duplicate registration. |

Leave both boxes empty and press **Save** to remove an ABHA.

## Shareable health records

When a patient has records ready, a list called **Health records (shareable)** appears in the same box. Tap a record to open it. Each one is prepared in the national format; sending to the ABDM gateway starts once the gateway is connected.

## Check your work

- **ABDM** shows **Patients with ABHA** going up as you add numbers.
- The patient's box shows the formatted number after saving.
