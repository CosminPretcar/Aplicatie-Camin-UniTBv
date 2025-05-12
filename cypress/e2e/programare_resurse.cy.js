describe('Testare programări resurse - Cămin@UniTBv', () => {

  // Autentificare înainte de fiecare test
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('cosmin.pretcar@student.unitbv.ro');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/home');
  });

  it('Creare, verificare dublare și ștergere programare pentru mașina de spălat', () => {
    // Navigare la pagina de programare resurse
    cy.contains('Programare resurse').click();
    cy.url().should('include', '/programare-resurse');

    // Selectare tip resursă și resursă specifică
    cy.get('select[name="tipResursa"]').select('Mașină de spălat');
    cy.get('select[name="idResursa"]').select('1');  // Alege prima resursă disponibilă

    // Alege un slot liber și confirmă programarea
    cy.get('td.bg-success').first().click();
    cy.contains('Confirmă').click();
    cy.get('.toast-body').should('contain', 'Programarea a fost realizată cu succes!');

    // Verificare dacă programarea apare în tabelul "Programările mele"
    cy.get('table').within(() => {
      cy.contains('Mașina 1').should('exist');
    });

    // Încercare de rezervare dublă în același interval
    cy.get('td.bg-info').first().should('have.css', 'cursor', 'not-allowed');

    // Verificare dacă sloturile ocupate (indiferent de cine) au cursorul "not-allowed"
    cy.get('td.bg-danger').first().should('have.css', 'cursor', 'not-allowed');

    // Ștergere programare existentă
    cy.get('table').contains('Șterge').click();
    cy.on('window:confirm', () => true);  // Confirmă ștergerea

    // Verificare dispariție programare
    cy.get('table').should('not.contain', 'Mașina 1');
  });
});
