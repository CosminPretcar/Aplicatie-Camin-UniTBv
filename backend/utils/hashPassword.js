import pg from "pg";
import bcrypt from "bcrypt";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "licenta",
  password: "Telecomanda1",
  port: 5432,
});

db.connect();

async function hashExistingPasswords() {
  try {
    const result = await db.query("SELECT id, password FROM users");

    for (let user of result.rows) {
      if (!user.password.startsWith("$2b$")) { // Verifică dacă parola nu e deja hash-uită
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user.id]);
        console.log(`Parola hash-uită pentru user ID: ${user.id}`);
      }
    }

    console.log("Toate parolele au fost actualizate.");
    db.end();
  } catch (error) {
    console.error("Eroare la hash-uirea parolelor:", error);
    db.end();
  }
}

hashExistingPasswords();
