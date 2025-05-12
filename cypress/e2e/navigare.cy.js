describe('Test de navigare prin navbar - Cămin@UniTBv', () => {
  
  // Autentificare înainte de navigare
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/home');  // Verificare autentificare reușită
  });

  it('Navigare la pagina Home', () => {
    cy.contains('Home').click();
    cy.url().should('include', '/home');
    cy.contains('Bine ai revenit');
  });

  it('Navigare la pagina Cerere Cazare', () => {
    cy.contains('Cerere Cazare').click();
    cy.url().should('include', '/cerere-cazare');
    cy.contains('Formular Cerere Cazare');
  });

  it('Navigare la pagina Review lunar', () => {
    cy.contains('Review lunar').click();
    cy.url().should('include', '/reviewlunar');
    cy.contains('Review lunar');
  });

  it('Navigare la pagina Colegii de cămin', () => {
    cy.contains('Colegii de camin').click();
    cy.url().should('include', '/colegi-pe-camere');
    cy.contains('Colegii pe camere');
  });

  it('Navigare la pagina Raportează o problemă', () => {
    cy.contains('Raporteaza o problema').click();
    cy.url().should('include', '/raporteaza-probleme');
    cy.contains('Raportează o problemă');
  });

  it('Navigare la pagina Programare resurse', () => {
    cy.contains('Programare resurse').click();
    cy.url().should('include', '/programare-resurse');
    cy.contains('Selecteaza resursa');
  });

  it('Logout din aplicație', () => {
    cy.contains('Logout').click();
    cy.url().should('include', '/');
    cy.contains('Autentificare - Camin@UniTBv');
  });

});
