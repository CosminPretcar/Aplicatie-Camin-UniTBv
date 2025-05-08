describe('Test de autentificare - Cămin@UniTBv', () => {
    beforeEach(() => {
      cy.visit('/');
    });
  
    it('Autentificare cu date valide', () => {
      cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      // Verifică dacă utilizatorul a fost redirecționat la pagina principală
      cy.url().should('include', '/home');
      cy.contains('Bine ai revenit');
    });
  
    it('Autentificare cu date incorecte', () => {
      cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
      cy.get('input[name="password"]').type('gresit123');
      cy.get('button[type="submit"]').click();
  
      // Verifică apariția mesajului de eroare
      cy.contains('Autentificare eșuată. Verifică datele.');
    });
  
    it('Vizualizare parola', () => {
      cy.get('input[name="password"]').type('parola123');
      cy.get('.inputLogin + span').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    });
  
    it('Navigare către resetare parolă', () => {
      cy.contains('Ai uitat parola?').click();
      cy.url().should('include', '/resetare-parola');
    });
  
    it('Mesaj toast la autentificare reușită', () => {
      cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      // Verifică apariția toast-ului de succes
      cy.get('.toast').should('be.visible');
      cy.get('.toast-body').should('contain', 'Autentificare reușită!');
    });
  });
  