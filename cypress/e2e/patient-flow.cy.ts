describe('Patient Flow (E2E)', () => {
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
    cy.contains('Patients').click();
    cy.url().should('include', '/patients');
  });

  it('should display the patient list with table headers', () => {
    cy.contains('h2', 'Patients').should('be.visible');
    cy.contains('th', 'ID').should('be.visible');
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('th', 'Phone').should('be.visible');
    cy.contains('th', 'Age/Gender').should('be.visible');
    cy.contains('th', 'Last Visit').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
  });

  it('should show patient rows with mock data', () => {
    cy.contains('td', 'Rahul Sharma').should('be.visible');
    cy.contains('td', 'Priya Patel').should('be.visible');
    cy.contains('td', 'Amit Singh').should('be.visible');
  });

  it('should show search input and filter button', () => {
    cy.get('input[placeholder="Search patients..."]').should('be.visible');
    cy.contains('button', 'Filter').should('be.visible');
    cy.contains('button', 'Add Patient').should('be.visible');
  });

  it('should open and close the Add Patient modal', () => {
    cy.contains('button', 'Add Patient').click();
    cy.contains('h3', 'Add New Patient').should('be.visible');
    cy.get('#patientFullName').should('be.visible');
    cy.contains('button', 'Cancel').click();
    cy.contains('h3', 'Add New Patient').should('not.exist');
  });

  it('should create a new patient via the modal', () => {
    cy.contains('button', 'Add Patient').click();
    cy.get('#patientFullName').type('Test Patient E2E');
    cy.get('#patientDob').type('1990-01-15');
    cy.get('#patientGender').select('FEMALE');
    cy.get('#patientPhone').type('9999999999');
    cy.get('#patientEmail').type('test@example.com');
    cy.contains('button', 'Save Patient').click();
    cy.contains('Test Patient E2E').should('be.visible');
  });

  it('should show validation on empty required fields in add modal', () => {
    cy.contains('button', 'Add Patient').click();
    cy.get('#patientFullName').clear();
    cy.contains('button', 'Save Patient').click();
    cy.get('#patientFullName').should('have.class', 'ng-invalid');
  });

  it('should navigate to patient detail on name click', () => {
    cy.contains('a', 'Rahul Sharma').click();
    cy.url().should('include', '/patients/');
    cy.contains('Patient Profile').should('be.visible');
  });

  it('should display patient detail with overview tabs', () => {
    cy.contains('a', 'Rahul Sharma').click();
    cy.contains('UHID: CLI-001').should('be.visible');
    cy.contains('Rahul Sharma').should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Medical History').should('be.visible');
    cy.contains('Appointments').should('be.visible');
    cy.contains('Billing').should('be.visible');
  });

  it('should show pagination info on patient list', () => {
    cy.contains('Showing').should('be.visible');
    cy.contains('results').should('be.visible');
  });
});
