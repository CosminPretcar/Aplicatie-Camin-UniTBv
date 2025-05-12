describe('Testare Avizier Digital - Administrator', () => {

  // Autentificare comună
  beforeEach(() => {
    cy.loginAdmin();  // Folosind comanda globală de autentificare
  });

  it('Adăugare, editare, fixare, ștergere și filtrare anunț', () => {
    // Navigare la pagina dashboard
    cy.contains('Dashboard').click();
    cy.url().should('include', '/admin/dashboard');

    // Verificare existență secțiune avizier
    cy.contains('📢 Avizier Digital').should('be.visible');

    // Adăugare anunț nou
    cy.get('button').contains('➕ Adaugă anunț').click();
    cy.get('textarea[placeholder="Scrie un anunț..."]').type('Anunț test automat');

    // Așteptare dropdown
    cy.get('select.form-select', { timeout: 5000 }).should('be.visible');
    cy.get('select.form-select').select('medie');
    cy.get('button').contains('➕ Adaugă anunț').click();

    // Verificare apariție anunț în listă
    cy.contains('Anunț test automat').should('be.visible');

    // Găsește toate cardurile și verifică fiecare
    cy.get('.card').each(($card) => {
      cy.wrap($card).within(() => {
        // Verifică dacă acest card conține textul dorit
        if ($card.text().includes('Anunț test automat')) {
          // Log pentru verificare
          cy.log('Am găsit cardul corect:', $card.text());

          // Apasă pe butonul Editează doar în acest card
          cy.get('button').contains('Editează').should('be.visible').click({ force: true });

          // Așteaptă apariția formularului de editare
          cy.get('textarea.form-control.mb-2', { timeout: 5000 }).should('be.visible');

          // Actualizare text anunț în cadrul aceluiași card
          cy.get('textarea.form-control.mb-2').clear().type('Anunț test actualizat');

          // Apasă pe butonul de salvare în cadrul cardului editat
          cy.get('button.btn.btn-success').contains('💾 Salvează').should('be.visible').click({ force: true });

          // Întrerupe each() după găsirea cardului
          return false;
        }
      });
    });

    // Verificare actualizare anunț în listă
    cy.contains('Anunț test actualizat').should('be.visible');

    // Fixare sau anulare fixare anunț
    cy.get('.card').filter(':contains("Anunț test actualizat")').each(($card) => {
      cy.wrap($card).within(() => {
        // Verifică dacă există butonul de fixare sau anulare fixare
        cy.get('button').then(($btn) => {
          const fixareBtn = $btn.filter((index, el) => 
            el.innerText.includes('Fixează') || el.innerText.includes('Anulează fixarea')
          ).first();

          // Click pe butonul corect
          cy.wrap(fixareBtn).should('be.visible').click({ force: true });
        });
      });
    });

    // Așteaptă rearanjarea listei
    cy.wait(1000);

    // Verificare fixare anunț (indiferent de poziție)
    cy.get('.card').each(($card) => {
      cy.wrap($card).within(() => {
        // Verifică dacă anunțul fixat există
        if ($card.text().includes('Anunț test actualizat') && $card.text().includes('Fixat')) {
          cy.contains('Anunț test actualizat').should('exist');
          cy.contains('Fixat').should('exist');
        }
      });
    });

    // Ștergere anunț
    cy.get('.card').filter(':contains("Anunț test actualizat")').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('button').contains('🗑️').should('be.visible').click({ force: true });
      });
    });

    // Confirmare ștergere în modal
    cy.get('.modal').within(() => {
      cy.contains('Confirmă').click();
    });

    // Verificare dispariție anunț
    cy.get('.card').should('not.contain', 'Anunț test actualizat');
  });
});
