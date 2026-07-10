describe('License & Subscription Display (E2E)', () => {
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

  it('should show Cliniva brand name in the sidebar', () => {
    cy.contains('Cliniva HMS').should('be.visible');
  });

  it('should have navigation links matching licensed modules', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Patients').should('be.visible');
    cy.contains('Appointments').should('be.visible');
    cy.contains('Doctors').should('be.visible');
    cy.contains('Consultations').should('be.visible');
    cy.contains('Billing').should('be.visible');
    cy.contains('Pharmacy').should('be.visible');
    cy.contains('Settings').should('be.visible');
  });

  it('should not show the trial banner for ACTIVE subscription', () => {
    cy.get('app-trial-banner').should('not.exist');
  });

  it('should display user profile section in sidebar after login', () => {
    cy.contains('Admin').should('be.visible');
    cy.contains('ADMIN').should('be.visible');
  });

  it('should have a logout button in the sidebar', () => {
    cy.contains('button', 'Logout').should('be.visible');
  });

  it('should show medical_services icon in sidebar header', () => {
    cy.get('.material-symbols-outlined').contains('medical_services').should('be.visible');
  });

  it('should display the header with search bar in authenticated layout', () => {
    cy.get('app-header').should('be.visible');
    cy.get('input[placeholder*="Search"]').should('be.visible');
  });

  it('should have notification and help icons in the header', () => {
    cy.contains('notifications').should('be.visible');
    cy.contains('help').should('be.visible');
  });

  it('should show New Appointment button in header', () => {
    cy.contains('+ New Appointment').should('be.visible');
  });

  it('should allow navigating to all major modules from sidebar', () => {
    const modules = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Consultations', 'Billing', 'Pharmacy', 'Settings'];
    modules.forEach(mod => {
      cy.contains('a', mod).should('be.visible');
    });
  });

  it('should display the dashboard with stat cards after login', () => {
    cy.contains("Today's Appointments").should('be.visible');
    cy.contains('Total Patients').should('be.visible');
    cy.contains('Pending Bills').should('be.visible');
    cy.contains('Doctors Available').should('be.visible');
  });

  it('should show the patient queue table on the dashboard', () => {
    cy.contains("Today's Patient Queue").should('be.visible');
    cy.contains('Token No').should('be.visible');
    cy.contains('Patient Name').should('be.visible');
    cy.contains('Doctor').should('be.visible');
    cy.contains('Status').should('be.visible');
  });

  it('should display quick actions on the dashboard', () => {
    cy.contains('Register Patient').should('be.visible');
    cy.contains('Book Appointment').should('be.visible');
    cy.contains('Collect Payment').should('be.visible');
  });

  it('should have the correct breadcrumb on the dashboard', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Overview').should('be.visible');
  });
});
