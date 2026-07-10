Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login');
    cy.get('input[type="email"]').type(email);
    cy.contains('button', 'Send OTP').click();
    cy.get('input[otp-input]').first().type('1');
    cy.contains('button', 'Verify & Login').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('setToken', (token: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('cliniva_access_token', token);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      setToken(token: string): Chainable<void>;
    }
  }
}
