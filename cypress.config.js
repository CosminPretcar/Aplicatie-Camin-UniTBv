const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      const fs = require('fs');
      const path = require('path');

      // Task pentru citirea fișierelor dintr-un director
      on('task', {
        readdir(folderPath) {
          return new Promise((resolve, reject) => {
            fs.readdir(folderPath, (err, files) => {
              if (err) {
                return reject(err);
              }
              resolve(files);
            });
          });
        },
        // Task pentru ștergerea folderului de descărcări înainte de test
        deleteDownloads() {
          const downloadsFolder = path.join(__dirname, '..', 'downloads');
          if (fs.existsSync(downloadsFolder)) {
            fs.rmSync(downloadsFolder, { recursive: true, force: true });
          }
          return null;
        },
      });

      // Configurare pentru a seta folderul de descărcare în Chrome
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.preferences.default['download'] = {
            default_directory: path.join(__dirname, '..', 'downloads'),
            prompt_for_download: false,
            directory_upgrade: true,
          };
        }
        return launchOptions;
      });
    },
    downloadsFolder: 'cypress/downloads'
  },
});
