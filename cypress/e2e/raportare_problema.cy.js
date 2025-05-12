describe('Testare raportare problemă - Cămin@UniTBv', () => {

  // Autentificare înainte de fiecare test
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/home');
  });

  it('Raportare, verificare și ștergere problemă', () => {
    // Navigare la pagina de raportare problemă
    cy.contains('Raporteaza o problema').click();
    cy.url().should('include', '/raporteaza-probleme');

    // Completare formular de raportare
    cy.get('input[placeholder="Ex: Țeavă spartă în baie"]').type('Test problemă');
    cy.get('textarea[placeholder="Descrie problema cât mai detaliat..."]').type('Aceasta este o problemă de test pentru verificare.');
    
    // Trimitere sesizare
    cy.get('button').contains('Trimite sesizarea').click();

    // Verificare mesaj de succes
    cy.contains('Sesizarea a fost trimisă cu succes!').should('be.visible');

    // Așteptare încărcare tabel și verificare problemă nouă
    cy.get('table', { timeout: 10000 }).should('be.visible');
    cy.get('table').within(() => {
      cy.contains('Test problemă').should('exist');
      cy.contains('Aceasta este o problemă de test pentru verificare.').should('exist');
    });

    // Deschidere modal de confirmare ștergere
    cy.get('table').contains('Test problemă').parents('tr').within(() => {
      cy.get('button').contains('🗑️').click({ force: true });
    });

    // Verificare că modalul de confirmare apare
    cy.get('.modal').should('be.visible');

    // Confirmare ștergere în modal
    cy.get('.modal').within(() => {
      cy.contains('Confirmă ștergerea').click();
    });

    // Verificare dispariție modal după ștergere
    cy.get('.modal', { timeout: 5000 }).should('not.exist');

    // Verificare mesaj succes ștergere
    cy.contains('Sesizarea a fost ștearsă.').should('be.visible');

    // Navigare la pagina Home pentru a reîncărca datele
    cy.contains('Home').click({ force: true });
    cy.url().should('include', '/home');

    // Revenire la pagina de raportare problemă
    cy.contains('Raporteaza o problema').click({ force: true });
    cy.url().should('include', '/raporteaza-probleme');

    // Verificare dispariție problemă din listă
    cy.get('table', { timeout: 10000 }).should('be.visible').within(() => {
      cy.contains('Test problemă').should('not.exist');
    });
  });
});
