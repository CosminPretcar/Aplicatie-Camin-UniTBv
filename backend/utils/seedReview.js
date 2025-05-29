import pg from "pg";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

// Funcție pentru a genera o lună aleatorie în ultimele 6 luni
const getLunaAleatorie = () => {
  const data = new Date();
  const randomMonthOffset = faker.number.int({ min: 0, max: 5 }); // Selectează o lună între 0 și 5 luni în urmă
  data.setMonth(data.getMonth() - randomMonthOffset);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
};

const generateFakeReviews = async (numReviews) => {
  for (let i = 0; i < numReviews; i++) {
    const caminId = faker.helpers.arrayElement([3, 4]); // Selectează un camin random (modifică după necesități)
    const curatenie = faker.number.int({ min: 1, max: 5 });
    const facilitati = faker.number.int({ min: 1, max: 5 });
    const zgomot = faker.number.int({ min: 1, max: 5 });
    const internet = faker.number.int({ min: 1, max: 5 });
    const personal_administrativ = faker.number.int({ min: 1, max: 5 });
    const securitate = faker.number.int({ min: 1, max: 5 });

    const lunaRecenzie = getLunaAleatorie(); // Generează o lună aleatorie

    try {
      await db.query(
        `INSERT INTO recenzii_camine (camin_id, curatenie, facilitati, zgomot, internet, personal_administrativ, securitate, luna_recenzie) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [caminId, curatenie, facilitati, zgomot, internet, personal_administrativ, securitate, lunaRecenzie]
      );
      console.log(`✅ Recenzie adăugată pentru căminul ${caminId} în luna ${lunaRecenzie}`);
    } catch (error) {
      console.error("❌ Eroare la inserare recenzie:", error);
    }
  }
  db.end();
};

// Rulează scriptul pentru a adăuga 20 de recenzii false
generateFakeReviews(40);
