describe('Login Flow (E2E)', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display the generic login page with email input', () => {
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.contains('button', 'Continue').should('be.visible');
  });

  it('should show validation error for empty email', () => {
    cy.contains('button', 'Continue').click();
    cy.contains('Please enter a valid email address').should('be.visible');
  });

  it('should resolve tenant via email and navigate to password login', () => {
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();
    cy.url().should('include', '/login');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('button', 'Continue').should('be.visible');
  });

  it('should show error for invalid email/password combination', () => {
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('button', 'Continue').click();
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should validate empty password', () => {
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();
    cy.get('input[type="password"]').clear();
    cy.contains('button', 'Continue').click();
    cy.contains('Please enter your password').should('be.visible');
  });

  it('should show error for invalid email format', () => {
    cy.get('input[type="email"]').type('not-an-email');
    cy.contains('button', 'Continue').click();
    cy.contains('Please enter a valid email address').should('be.visible');
  });

  it('should complete full login flow: email → password → OTP → dashboard', () => {
    // Step 1: Enter email on generic login
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();

    // Step 2: Enter password
    cy.url().should('include', '/login');
    cy.get('input[type="password"]').type('admin');
    cy.contains('button', 'Continue').click();

    // Step 3: Enter OTP
    cy.url().should('include', '/otp');
    cy.get('input[maxlength="1"]').should('have.length', 6);
    cy.get('input[maxlength="1"]').each(($el, index) => {
      cy.wrap($el).type((index + 1).toString());
    });
    cy.contains('button', 'Verify & Login').click();

    // Step 4: Verify dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should allow going back from OTP to password page', () => {
    cy.get('input[type="email"]').type('admin@clinivahms.com');
    cy.contains('button', 'Continue').click();
    cy.get('input[type="password"]').type('admin');
    cy.contains('button', 'Continue').click();

    cy.url().should('include', '/otp');
    cy.contains('button', 'Back').click();
    cy.url().should('include', '/login');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should redirect to login when accessing protected route without auth', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('should have a working Enter Hospital Code link on the generic login page', () => {
    cy.contains('Enter Hospital Code instead').should('be.visible');
  });

  it('should redirect with returnUrl when accessing protected route', () => {
    cy.visit('/t1/patients');
    cy.url().should('match', /\/login(\?returnUrl=.*)?$/);
  });
});
