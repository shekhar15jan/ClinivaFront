describe('Appointment Flow (E2E)', () => {
  before(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();
    cy.get('input[type="password"]').type('admin');
    cy.contains('button', 'Continue').click();
    cy.get('input[maxlength="1"]').each(($el, index) => {
      cy.wrap($el).type((index + 1).toString());
    });
    cy.contains('button', 'Verify & Login').click();
    cy.url().should('include', '/dashboard');
  });

  beforeEach(() => {
    cy.contains('Appointments').click();
    cy.url().should('include', '/appointments');
  });

  it('should display the appointment calendar page', () => {
    cy.contains('h2', 'Appointments').should('be.visible');
    cy.contains('button', 'New Appointment').should('be.visible');
  });

  it('should show calendar view toggle buttons', () => {
    cy.contains('button', 'Day').should('be.visible');
    cy.contains('button', 'Week').should('be.visible');
    cy.contains('button', 'Month').should('be.visible');
  });

  it('should display doctor columns in the calendar grid', () => {
    cy.contains('Dr. Anita Desai').should('be.visible');
    cy.contains('Dr. Vivek Kumar').should('be.visible');
  });

  it('should show time blocks on the calendar', () => {
    cy.contains('09:00 AM').should('be.visible');
    cy.contains('10:00 AM').should('be.visible');
    cy.contains('11:00 AM').should('be.visible');
  });

  it('should display existing appointments on the calendar', () => {
    cy.contains('Rahul Sharma').should('be.visible');
    cy.contains('Priya Patel').should('be.visible');
    cy.contains('Amit Singh').should('be.visible');
  });

  it('should navigate to booking flow when clicking New Appointment', () => {
    cy.contains('button', 'New Appointment').click();
    cy.url().should('include', '/appointments/book');
    cy.contains('h2', 'Book Appointment').should('be.visible');
  });

  it('should display booking wizard with 3 steps', () => {
    cy.contains('button', 'New Appointment').click();
    cy.contains('Step 1').should('be.visible');
    cy.contains('Step 2').should('be.visible');
    cy.contains('Step 3').should('be.visible');
    cy.contains('Doctor & Time').should('be.visible');
    cy.contains('Patient Details').should('be.visible');
    cy.contains('Confirm').should('be.visible');
  });

  it('should select a doctor and time slot in step 1', () => {
    cy.contains('button', 'New Appointment').click();
    cy.contains('Dr. Anita Desai').click();
    cy.contains('09:00').click();
    cy.contains('button', 'Next Step').should('not.be.disabled');
    cy.contains('button', 'Next Step').click();
    cy.contains('Step 2').should('be.visible');
  });

  it('should select existing patient in step 2 and confirm in step 3', () => {
    cy.contains('button', 'New Appointment').click();
    cy.contains('Dr. Anita Desai').click();
    cy.contains('09:00').click();
    cy.contains('button', 'Next Step').click();
    cy.get('#patientId').select('1');
    cy.contains('button', 'Next Step').click();
    cy.contains('Confirm Appointment').should('be.visible');
    cy.contains('button', 'Confirm Booking').should('be.visible');
  });

  it('should successfully create an appointment via the booking flow', () => {
    cy.contains('button', 'New Appointment').click();
    cy.contains('Dr. Anita Desai').click();
    cy.contains('09:00').click();
    cy.contains('button', 'Next Step').click();
    cy.get('#patientId').select('1');
    cy.contains('button', 'Next Step').click();
    cy.contains('button', 'Confirm Booking').click();
    cy.url().should('include', '/appointments');
  });

  it('should allow navigating back to appointments list from booking flow', () => {
    cy.contains('button', 'New Appointment').click();
    cy.get('[routerLink="/appointments"]').first().click();
    cy.url().should('include', '/appointments');
  });
});
