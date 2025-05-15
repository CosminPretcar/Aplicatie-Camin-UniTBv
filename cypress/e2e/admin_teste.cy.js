describe('Testare Dashboard Administrator - Monitorizare, Recenzii, Camere', () => {

  // Autentificare înainte de toate testele
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/dashboard');
  });

// ✅ Testare Monitorizare Activitate
it('Monitorizare activitate - Grafice și Export', () => {
  cy.contains('Monitorizare Activitate').click();
  cy.url().should('include', '/monitorizare-activitate');

  // Așteptare ca toate canvas-urile să fie generate
  cy.get('canvas', { timeout: 10000 }).should('have.length.at.least', 5);

  // Verificare existență și dimensiuni pentru fiecare canvas
  cy.get('canvas', { timeout: 10000 }).each(($canvas, index) => {
    cy.wrap($canvas).scrollIntoView({ easing: 'linear', duration: 1000 }).should('exist');
    cy.wrap($canvas).invoke('width').should('be.greaterThan', 0);
    cy.wrap($canvas).invoke('height').should('be.greaterThan', 0);
    cy.log(`Grafic ${index + 1} este vizibil cu dimensiuni corecte`);
  });

  // Export grafice
  const butoaneExport = [
    '💾 Exportă imagine',
    '💾 Exportă imagine',
    '💾 Exportă imagine',
    '💾 Exportă imagine',
    '💾 Exportă imagine'
  ];

  butoaneExport.forEach((buton, index) => {
    cy.contains(buton).scrollIntoView().click({ force: true });
    cy.wait(1000);
    cy.log(`Grafic ${index + 1} exportat`);
  });
});


// ✅ Testare Recenzii Lunare
it('Recenzii lunare - Filtrare și grafic evoluție', () => {
  cy.visit('/admin/dashboard');
  cy.contains('Review Lunar').click();
  cy.url().should('include', '/review-lunar');

  // Filtrare comentarii după lună
  const luni = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
  ];

  luni.forEach((luna, index) => {
    // Așteaptă ca dropdown-ul să fie vizibil
    cy.get('select').should('be.visible');

    // Selectează luna din dropdown folosind numele, nu indexul
    cy.get('select').select(luna);
    cy.wait(500);

    if (luna === "Martie") {
      // Verifică dacă apar comentarii pentru luna Martie
      cy.get('.card').each(($card) => {
        if ($card.text().includes('Luna: 2025-03')) {
          cy.wrap($card).within(() => {
            cy.get('p').should('contain', 'Luna: 2025-03');
            cy.get('p').should('not.contain', 'Nu există comentarii pentru luna selectată');
            cy.log(`Recenzii disponibile pentru ${luna}`);
          });
        }
      });
    } else {
      // Verifică dacă nu apar comentarii pentru alte luni
      cy.get('.card').each(($card) => {
        if ($card.text().includes('Nu există comentarii pentru luna selectată')) {
          cy.wrap($card).within(() => {
            cy.get('p').should('contain', 'Nu există comentarii pentru luna selectată');
            cy.log(`Nicio recenzie disponibilă pentru ${luna}`);
          });
        }
      });
    }
  });

  // Verificare grafic evoluție recenzii
  cy.get('canvas').should('be.visible');
});

});
