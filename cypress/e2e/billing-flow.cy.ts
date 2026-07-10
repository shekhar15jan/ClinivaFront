describe('Billing Flow (E2E)', () => {
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
    cy.contains('Billing').click();
    cy.url().should('include', '/billing');
  });

  it('should display the billing list page', () => {
    cy.contains('h1', 'Bills & Invoices').should('be.visible');
  });

  it('should show bill list table with correct columns', () => {
    cy.contains('th', 'Invoice #').should('be.visible');
    cy.contains('th', 'Patient').should('be.visible');
    cy.contains('th', 'Date').should('be.visible');
    cy.contains('th', 'Total').should('be.visible');
    cy.contains('th', 'Paid').should('be.visible');
    cy.contains('th', 'Due').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.contains('th', 'Actions').should('be.visible');
  });

  it('should display mock bills in the list', () => {
    cy.contains('Rahul Sharma').should('be.visible');
    cy.contains('Priya Patel').should('be.visible');
  });

  it('should show correct status badges for bills', () => {
    cy.contains('PAID').should('be.visible');
    cy.contains('UNPAID').should('be.visible');
  });

  it('should have search input and status filter', () => {
    cy.get('input[placeholder*="Search"]').should('be.visible');
    cy.get('select').should('be.visible');
    cy.get('select option').should('contain', 'All Status');
    cy.get('select option').should('contain', 'Paid');
    cy.get('select option').should('contain', 'Unpaid');
    cy.get('select option').should('contain', 'Partially Paid');
  });

  it('should show correct payment amounts for bills', () => {
    cy.contains('₹525').should('be.visible');
    cy.contains('₹419').should('be.visible');
  });

  it('should navigate to invoice detail when clicking View', () => {
    cy.contains('a', 'View').first().click();
    cy.url().should('include', '/billing/b-001');
  });

  it('should display invoice detail page with correct components', () => {
    cy.contains('a', 'View').first().click();
    cy.contains('Invoice').should('be.visible');
    cy.contains('Collect Payment').should('be.visible');
    cy.contains('Print').should('be.visible');
  });

  it('should show invoice line items and totals', () => {
    cy.contains('a', 'View').first().click();
    cy.contains('Description').should('be.visible');
    cy.contains('Qty').should('be.visible');
    cy.contains('Rate').should('be.visible');
    cy.contains('Amount').should('be.visible');
    cy.contains('Subtotal').should('be.visible');
    cy.contains('Total').should('be.visible');
  });

  it('should display patient info on invoice detail', () => {
    cy.contains('a', 'View').first().click();
    cy.contains('Rahul Sharma').should('be.visible');
  });

  it('should handle collect payment flow on invoice', () => {
    cy.contains('a', 'View').first().click();
    cy.contains('Collect Payment').should('be.visible');
  });
});
