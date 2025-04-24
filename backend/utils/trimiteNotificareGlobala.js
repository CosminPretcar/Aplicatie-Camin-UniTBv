import db from "../index.js";

export const trimiteNotificareGlobala = async (titlu, mesaj, tip = null, id_anunt_student = null, id_anunt_admin = null) => {
  try {
    await db.query(
      `INSERT INTO notificari_globale (titlu, mesaj, tip, id_anunt_student, id_anunt_admin)
       VALUES ($1, $2, $3, $4, $5)`,
      [titlu, mesaj, tip, id_anunt_student, id_anunt_admin]
    );
    console.log("✅ Notificare globală trimisă!");
  } catch (err) {
    console.error("❌ Eroare la trimiteNotificareGlobala:", err);
  }
};
