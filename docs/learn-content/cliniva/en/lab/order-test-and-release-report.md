---
id: clin.lab.order-to-report
product: CLIN
roles: [doctor, receptionist, lab_technician, admin]
task: Lab
screens: [lab, lab/tests, lab/new, lab/order, patients/detail]
plan_modules: [LAB]
media: []
verified_on: 2026-10-31
---

# Order a lab test and release the report

A lab order goes through five steps, and the order's status shows where it is: **To collect**, then **In the lab**, then **Results in**, then **Reported** (or **Cancelled**).

| Step | Who | What |
|---|---|---|
| Order | Doctor, receptionist, or anyone with *Order lab tests* | Choose the tests for a patient |
| Bill | Billing desk | Make the bill for the tests |
| Collect | Lab technician | Take the samples |
| Results | Lab technician | Type the values; abnormal ones are flagged |
| Verify | Lab technician with *Verify lab results* | Release the report |

## Set up the test catalog (once, by the clinic administrator)

1. Open **Lab**, then press **Test catalog**.
2. Press **Add common tests** to fill the usual ones (for example *Complete Blood Count* and *Blood Sugar Fasting*), or press **Add test** for your own.
3. For each test you can set the **Code**, **Name**, **Price**, **Category**, **Sample**, **Turnaround hours**, and the **Values reported**: each value has a **Unit**, **Normal from** and **Normal to** (or a **Normal answer** for text results).
   Set the ranges to match your analyser and method. A change applies to new reports only.

## Order tests for a patient

1. Open the patient and press **Order lab tests**.
2. Search and tap the tests you want. The button counts them, for example **Order 2 tests**.
3. Add a **Note for the lab** if useful (for example "fever 4 days") and press the order button.
4. The order opens with the status **To collect**.

## Bill the order

On the order press **Bill ₹…** (the total is on the button). The header then shows **Billed: BILL-…**, and a link opens the bill in **Billing**, where it is collected like any other.

**Admitted patients:** there is no Bill button. The tests are added to the patient's stay and paid with the final bill.

## Collect the samples

On the order press **Collect samples**. The status changes to **In the lab**.

## Enter the results

1. Next to each test press **Enter results**.
2. Type each value. As you type, a value outside the normal range is flagged immediately: for example a fasting glucose of **142** shows **HIGH**.
3. Add a **Comment (optional)** and press **Save results**. The test shows its values and the status **resulted**.
4. Made a mistake? Press **Correct results** on a resulted test and save again.

## Verify and release

1. Next to each resulted test press **Verify**. It shows **verified**.
2. As soon as one test is verified the **Report** button appears; press it to open or print the report of the verified tests. You do not have to wait for the slowest test.
3. When every test is verified the order shows **Reported**.

## Where to find work

Open **Lab**: the list shows **urgent orders first**; tap an order to collect, enter results or verify. Search by **patient, number or order**. **Inpatient** orders are marked so the ward can be reached quickly.

## Common problems

- **"No tests in the catalog yet."** The administrator must open **Test catalog** and press **Add common tests**.
- **"I cannot press Verify."** Your role needs *Verify lab results*. Entering results and verifying are separate permissions so one person can check another's work.
- **"Lab is not in the menu."** Your clinic's plan must include the **Lab** module.
