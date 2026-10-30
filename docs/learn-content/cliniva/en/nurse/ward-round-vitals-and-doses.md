---
id: clin.nurse.ward-round
product: CLIN
roles: [nurse, doctor]
task: Care
screens: [nursing, nursing/chart]
plan_modules: [NURSING, IPD]
media: []
verified_on: 2026-10-30
---

# Ward round: vitals, doses and handover

The **Ward round** screen shows every admitted patient with what needs doing next. It works on a phone: on a phone it is **Round** in the bottom bar.

## Read the round

Each patient is coloured by what is most urgent:

| Colour | Meaning |
|---|---|
| Red | A dose is **overdue** |
| Blue | A dose is **due** |
| Amber | **Vitals** are overdue |
| Green | Nothing is waiting |

Use the **ward** filter to see one ward. Open a patient to see their chart, which has three tabs: **Medicines**, **Vitals** and **Notes**.

## Give a dose

1. Open the patient, then **Medicines**.
2. Each order shows its times. A time that is **overdue** or **due** can be recorded; a dose already given cannot be given twice.
3. Tap the time and choose what happened: **Given**, **Held**, **Refused** or **Missed**.
4. If the dose was **not given**, write the reason (for example "Vomiting"). It is kept with the record.

## Record vitals

1. Open **Vitals**.
2. Fill in **only the readings you took** (temperature, pulse, SpO2 and so on). Empty fields are not sent.
3. Press save. The reading appears in the chart.

## Write a note or the shift handover

1. Open **Notes**.
2. Choose the kind: **Note**, **Handover** or **Incident**, and the shift (Morning, Evening or Night).
3. Write at least a few words and save. A **Handover** note is how you pass the patient to the next shift.

## Doctors

A doctor orders a medicine from the same chart (medicine, dose, route such as Oral or IV, how often, number of days) and can stop an order with a reason. Nurses do not order.

## With no network

A **vitals reading** or a **note** saved with no connection is kept **on the device**. The screen tells you "Saved on this device. It is sent when you are back online." and the chart stays as it was. It is sent once when the connection returns.
**Doses are not saved offline**: giving a medicine is confirmed live, so a failed save never looks like a given dose. Record the dose when the network is back.

## Common problems

- **"I cannot give a dose."** Your role may not allow it, or the dose is already given.
- **"The patient is not on the round."** They are not admitted, or are in a ward you filtered out.
