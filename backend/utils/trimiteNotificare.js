// utils/trimiteNotificare.js
import db from "../index.js"; // sau exportă `db` separat dacă nu e vizibil aici

export const trimiteNotificare = async (user_id, titlu, mesaj, tip = null) => {
  try {
    await db.query(`
      INSERT INTO notificari (user_id, titlu, mesaj, tip)
      VALUES ($1, $2, $3, $4)
    `, [user_id, titlu, mesaj, tip]);
  } catch (err) {
    console.error("Eroare la salvarea notificării:", err);
  }
};
