---
id: clin.pharmacy.stock
product: CLIN
roles: [pharmacist, admin]
task: Stock
screens: [medicines, stock, ipd/admissions]   # menu: Pharmacy, Stock, Admissions
plan_modules: [PHARMACY_STOCK, MEDICINE]
media: []
verified_on: 2026-10-31
---

# Manage medicine stock

Cliniva keeps stock in **batches**: each delivery has a batch number and an expiry date. Medicines are used **earliest expiry first**, and **expired stock is never issued**.

Who can do this: the pharmacist and the clinic administrator (permission *Add and edit medicines, prices and stock*). A nurse or doctor with *Issue medicines to inpatients* can issue and take returns, but not receive or write off stock.

## Add the medicine first

1. Open **Pharmacy** in the menu and add the medicine with its **name** and **price**. The price is what patients and wards are charged per unit.
2. A medicine must exist here before stock can be received against it.

## Receive stock from a supplier

1. Open **Stock** and press the **Receive** tab.
2. Choose the **Supplier**. If it is new, type its name under **New supplier** and press **Add**; it is selected for you.
3. Type the supplier's **Invoice no.**
4. On the first line choose the **Medicine**, then fill the **Batch** number, the **Expiry** date, the **Qty** and the **Cost per unit**.
   The expiry date is kept exactly as typed.
5. Need more medicines on the same invoice? Press **Add line** and repeat.
6. Press **Receive stock**.
7. Open the **Stock** tab, find the medicine and open it: the batch shows its expiry date and how much is left, for example `50/50`.

## See what needs attention

Open the **Alerts** tab:

- **Reorder** lists medicines at or below their reorder level.
- **Expiring in 60 days** lists batches close to expiry. Beside each is **Write off**.

To set a reorder level, open the medicine on the **Stock** tab, type the number under **Reorder at** and press **Save**. A medicine at or below it shows **Reorder (level N)**.

## Write off, and correct a count

- **Write off:** for a batch that has expired or is damaged, press **Write off** beside it. It leaves the shelf and shows as **Written off** in the medicine's movements.
- **Count correction:** if the shelf does not match the screen, open the medicine, choose the **Batch** (or *Without batch*), type the **Change (+ or -)** and a **Reason**, then save. It shows as **Count** in the movements.

## Issue to a ward patient, and take a return

1. Open the patient's stay (**Admissions** in the menu, then the patient).
2. Press **Issue medicine**, choose the medicine, type the quantity and save. The stay is charged at the medicine's price: 10 at ₹5 shows `× 10` and `₹50`.
3. If some come back unused, press **Return** beside that charge and type how many. Returning 3 changes the charge to `× 7` and `₹35`, and the 3 go back on the shelf.

## The medicine's history

Open any medicine on the **Stock** tab: under **Movements** every change is listed with its type: **Received**, **Sold (OPD)**, **Issued to ward**, **Returned**, **Written off** and **Count**. Use it to answer "where did this stock go?".

## Common problems

- **"The Stock tab is empty."** Add the medicine under **Pharmacy** first, then receive stock.
- **"Expired stock cannot be issued."** Write the batch off; the next batch with the earliest expiry is used instead.
- **"I cannot see Stock in the menu."** Your clinic's plan must include **Pharmacy stock**, and your role needs the medicine permission above.
