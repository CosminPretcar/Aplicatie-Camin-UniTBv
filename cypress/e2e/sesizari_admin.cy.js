describe('Testare gestionare sesizări - Administrator', () => {

  // Autentificare înainte de fiecare test
  beforeEach(() => {
    cy.loginAdmin();

    // Navigare la pagina de sesizări
    cy.contains('Sesizari').click();
    cy.url().should('include', '/sesizari');
  });

  // ✅ 1. Filtrare sesizări
  it('Filtrare sesizări după status', () => {
    const statusuri = ['toate', 'neprocesata', 'in_lucru', 'rezolvata'];
    statusuri.forEach((status) => {
      cy.get('.selector-status').select(status);
      cy.wait(500);
      cy.get('table tbody tr').each(($row) => {
        if (status !== 'toate') {
          cy.wrap($row).find('td').eq(5).should('contain', status);
        }
      });
    });
  });

  // ✅ 2. Actualizare status
  it('Actualizare status sesizare', () => {
    // Selectează prima sesizare și schimbă statusul
    cy.get('table tbody tr').first().within(() => {
      // Găsește div-ul care conține selectorul
      cy.get('.selector-update').within(() => {
        cy.get('select').select('in_lucru');
      });
  
      // Așteaptă ca statusul să se actualizeze
      cy.wait(500);
      cy.get('select').should('have.value', 'in_lucru');
    });
  
  });

  // ✅ 3. Export Excel
  it('Export sesizări în Excel', () => {
    // Șterge fișierele anterioare pentru a evita conflictele
    cy.task('deleteDownloads');  
    // Apasă pe butonul de export
    cy.get('button').contains('⬇️ Exportă sesizarile în Excel').click();  
    // Așteaptă descărcarea fișierului
    cy.wait(2000);  
    // Verifică dacă fișierul a fost descărcat
    const filePath = 'cypress/downloads/';
    cy.task('readdir', filePath).then((files) => {
      const excelFile = files.find((file) => file.startsWith('Sesizari_') && file.endsWith('.xlsx'));
      expect(excelFile).to.exist;
      cy.log(`Fișier găsit: ${excelFile}`);  
      // Verificare conținut fișier
      cy.readFile(`${filePath}${excelFile}`).should('exist');
    });
  });


  // ✅ 4. Ștergere sesizare
  it('Ștergere sesizare', () => {
    // Șterge prima sesizare din listă
    cy.get('table tbody tr').first().within(() => {
      cy.get('button').contains('🗑️').click();
    });

    // Confirmă ștergerea în modal
    cy.get('.modal').within(() => {
      cy.contains('Șterge').click();
    });

    // Verificare mesaj de succes
    cy.get('.toast-body').should('contain', 'Sesizarea a fost ștearsă');

    // Verificare dispariție sesizare
    cy.get('table tbody tr').should('not.contain', 'Sesizarea ștearsă');
  });

  // ✅ 5. Trimite email
  it('Trimitere email legat de o sesizare', () => {
    // Deschide modalul pentru trimitere email
    cy.get('table tbody tr').first().within(() => {
      cy.get('button').contains('📧').click({ force: true });
    });
  
    // Completează formularul de email
    cy.get('input[placeholder="Ex: Răspuns la sesizarea dvs."]').type('Răspuns sesizare');
    cy.get('textarea[placeholder="Scrie mesajul aici..."]').type('Bună ziua, sesizarea dvs. a fost procesată.');
  
    // Trimite emailul cu forțare pentru a preveni suprapunerea
    cy.get('.text-end > .btn').contains('Trimite').click({ force: true });
  
    // Așteaptă toast-ul de succes, fără a verifica închiderea modalului direct
    cy.get('.toast-body', { timeout: 15000 }).should('contain', 'Email trimis cu succes');
  
    // Verifică dacă modalul s-a închis automat după succes
    cy.get('.modal').should('not.exist');
  });



});
