---
id: clin.admin.staff-and-roles
product: CLIN
roles: [admin, hospital_admin]
task: Users and roles
screens: [users, roles]
plan_modules: []
media: []
verified_on: 2026-10-31
---

# Add staff and decide what each person may do

Everyone who works in the clinic has an account with one **role**. The role decides which menu entries they see and what they can do in them. You need the *User management* permission (the clinic administrator has it).

## Add a staff member

1. Open **Users** (the page is titled **User Management**) and press **+ Add User**.
2. Fill in **First name**, **Last name** and **Email**. The email is how the person signs in, so it cannot be changed later. Staff sign in with a code sent to that email.
3. Choose the **Role**. Built-in roles are listed first, then your own roles.
4. Optionally add the **Phone**, and a **Department**. The default, *Clinic-wide (no department)*, lets the person see all departments.
5. Press the save button. The message `name@clinic.com added` appears. If the email is already used or invalid, a message under the form says so.

## Change, pause or restore a person

In the list, on the person's row:

- **Edit**: change the name, role, phone or department.
- **Deactivate**: asks you to confirm (*They will no longer be able to sign in*). Use it when someone leaves. Their history stays. **Activate** brings them back.
- **Reset password**: shows a **New temporary password** once. Give it to the person; they are asked to change it when they use it. Press **Done** to close the box; it cannot be shown again.

## What each role may do

Open **Roles**. The lower half, **Built-in roles**, lists every built-in role with the exact things it may do, shown as small tags. Read it before you give someone a role.

## Make your own role

Use this when a built-in role is almost right, for example a *Senior nurse* who may also see reports.

1. On **Roles** press **New role**.
2. Type the **Name** (for example *Senior nurse*).
3. In **Works like** choose the built-in role to start from. Its permissions are ticked for you. A custom role still behaves like its base role (a nurse is still a nurse); you only change what is ticked.
4. Tick or untick permissions in their groups (Patients, Clinical, Appointments, Billing, Pharmacy, Hospital, Inpatients, Reports, Security). Permissions marked **Stays with the owner** cannot be given to anyone else.
5. Press **Save role**. It appears under **Your roles** with its staff count, and in the **Role** list when you add or edit a person.

To change a role press its edit icon; to remove it press the bin icon and confirm (*Staff who have it must be given another role first*).

## Check your work

- Sign in as the new person (or ask them) and confirm the menu shows only what the role should.
- **Roles** shows the staff count next to each of your own roles.
