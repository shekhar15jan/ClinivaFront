# Phone layout check list (patient, doctor, nurse)

Code-review check list, not an automated test (no Playwright run). Check at 360 x 640 and 390 x 844.

## All roles
- Top bar: menu, search icon, Help (question mark), bell and name all fit on one row; name truncates, nothing wraps off screen.
- Every tap target is at least 44 px (class `min-h-touch`); text is never lighter than slate-600.
- First-run tour card sits above the bottom bar (`bottom-20`) and its Next / Back / Show me / close buttons are tappable.
- Help page: articles open and close with one tap; "Take the quick tour again" is reachable without scrolling.
- Idle warning banner is readable and does not hide the bottom bar.
- Offline banner shows the count waiting and does not cover the Save button.

## Patient (portal, `patient/...`)
- Bottom bar: Dashboard, Appointments, Prescriptions, Bills, Profile.
- Help opens `patient/help` (not a staff screen); tour points only at `patient/...` routes.
- Pay a bill: payment buttons full width; no horizontal scroll.

## Doctor
- Bottom bar shows the first five menu items the role can open; Appointments and Consultations are among them.
- Consultation workspace: complaint, diagnosis, vitals and medicine rows stack in one column; sticky Finish and Print.
- Saving offline shows "Saved on this device" and the offline bar count goes up by one.

## Nurse
- Ward round is the first bottom-bar item (Round); patient cards coloured red / blue / amber / green.
- Chart tabs Medicines / Vitals / Notes reachable with one thumb; vitals form shows only the fields to fill.
- Vitals and notes queue offline; doses do not (record when back online).
