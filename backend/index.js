import express from "express";
import pg from "pg";
import cors from "cors"
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import ngrok from "ngrok";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import cron from "node-cron";
import fetch from "node-fetch";
import { trimiteNotificare } from "./utils/trimiteNotificare.js";
import { trimiteNotificareGlobala } from "./utils/trimiteNotificareGlobala.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const isAdmin= (req,res, next) => {
  if(req.isAuthenticated() && req.user.esteAdmin) {
    return next();
  }
  return res.status(403).json({message: "Acces interzis - doar administratorii au acces!"});
};

const storageProfil = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profil/"); // Folderul unde se salvează imaginile
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}${ext}`); // Salvez poza cu ID-ul utilizatorului
  }
});

const uploadProfil = multer({ storage: storageProfil });

const storageSesizari = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/sesizari/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `sesizare-${req.user.id}-${timestamp}${ext}`);
  },
});
const uploadSesizari = multer({ storage: storageSesizari });

const storageForum = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/forum"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const uploadForum = multer({ storage: storageForum });


cron.schedule("*/10 * * * *", async () => {
  try {
    const result = await db.query(`
      DELETE FROM programari_resurse
      WHERE data = CURRENT_DATE AND ora_start::time <= CURRENT_TIME
    `);
    console.log(`🧹 ${result.rowCount} programări începute șterse automat.`);
  } catch (err) {
    console.error("Eroare la ștergerea programărilor:", err);
  }
});

// 🗑️ Șterge automat anunțurile studenților expirate
cron.schedule("*/10 * * * *", async () => {
  try {
    const result = await db.query(`
      DELETE FROM anunturi_studenti
      WHERE data_expirare IS NOT NULL AND data_expirare <= CURRENT_TIMESTAMP
    `);
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} anunțuri expirate ale studenților șterse.`);
    }
  } catch (err) {
    console.error("Eroare la ștergerea anunțurilor expirate:", err);
  }
});


app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || TOPSECRETWORD, 
    resave: false,  
    saveUninitialized: true, 
    cookie: {
      secure: false, 
      httpOnly: true, 
      maxAge: 1000 * 60 * 60 * 24, 
    }
  })
);

 app.use(passport.initialize());
 app.use(passport.session());

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.get("/me", async (req, res) => {
  if (req.isAuthenticated()) {
    try {

      const studentInfo = await db.query(
        `SELECT facultate, specializare, grupa, telefon, descriere, sporturi_preferate, hobby_uri 
         FROM studenti WHERE user_id = $1`, 
        [req.user.id]
      );

      const studentData = studentInfo.rows[0] || {}; //daca nu exista setez un obiect gol
      return res.json({ 
        isAuthenticated: true, 
        id: req.user.id,
        nume: req.user.nume, 
        prenume: req.user.prenume, 
        email: req.user.email, 
        facultate: studentData.facultate || null, 
        specializare: studentData.specializare || null,
        grupa: studentData.grupa || null, 
        poza_profil: req.user.poza_profil,
        telefon: studentData.telefon || null,
        descriere: studentData.descriere || "",
        sporturi_preferate: studentData.sporturi_preferate || "",
        hobby_uri: studentData.hobby_uri || "",
        esteAdmin: req.user.administrator
      });
    } catch (error) {
        console.error("Eroare la preluarea datelor utilizatorului:", error);
        return res.status(500).json({ message: "Eroare de server" });
      }
  } else {
    return res.json({ isAuthenticated: false });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const mesaj = info?.message || "Autentificare eșuată. Verifică datele.";
      return res.status(401).json({ message: mesaj });
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      // try {
      //   const userResult = await db.query("SELECT email FROM users WHERE id = $1", [user.id]);
      //   const userEmail = userResult.rows[0].email;

      //   const mailOptions = {
      //     from: `"Sistem Cazare" <noreply@cazare.ro>`,
      //     to: userEmail,
      //     subject: "Autentificare reușită",
      //     text: `Salut, ${user.nume} ${user.prenume}!\n\nTe-ai autentificat cu succes în platforma de cazare.\n\nDacă nu ai fost tu, te rugăm să schimbi parola imediat!`
      //   };

      //   // Trimitem email-ul
      //   transporter.sendMail(mailOptions, (error, info) => {
      //     if (error) {
      //       console.error("Eroare la trimiterea emailului:", error);
      //     } else {
      //       console.log("Email de autentificare trimis:", info.response);
      //     }
      //   });

      // } catch (error) {
      //   console.log("Eroare la extragerea emailului:", error);
      // }

      return res.json({ 
        message: "Login successful", 
        nume: user.nume, 
        prenume: user.prenume, 
        esteAdmin: user.administrator
      });
    });
  })(req, res, next);
});

app.post("/cerere-schimbare-parola", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await db.query("SELECT id, prenume FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "Email inexistent." });

    const cod = Math.floor(100000 + Math.random() * 900000).toString(); // cod 6 cifre
    const expirare = new Date(Date.now() + 5 * 60 * 1000); // valabil 5 min

    await db.query("DELETE FROM coduri_resetare_parola WHERE user_id = $1", [user.id]); // șterg coduri vechi

    await db.query(
      `INSERT INTO coduri_resetare_parola (user_id, cod, expira_la)
       VALUES ($1, $2, $3)`,
      [user.id, cod, expirare]
    );

    await transporter.sendMail({
      from: `"Cămin@UniTBv" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Cod pentru resetarea parolei",
      text: `Salut, ${user.prenume}!\n\nCodul tău pentru resetarea parolei este: ${cod}\nValabil 5 minute.`
    });

    res.json({ message: "Codul a fost trimis pe email." });
  } catch (err) {
    console.error("Eroare cerere schimbare parolă:", err);
    res.status(500).json({ message: "Eroare de server" });
  }
});

app.post("/confirmare-schimbare-parola", async (req, res) => {
  const { email, cod, parolaNoua } = req.body;

  try {
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: "Email invalid." });

    const codResult = await db.query(
      `SELECT * FROM coduri_resetare_parola
       WHERE user_id = $1 AND cod = $2 AND expira_la > NOW()`,
      [user.id, cod]
    );

    if (codResult.rows.length === 0) {
      return res.status(400).json({ message: "Cod invalid sau expirat." });
    }

    const hash = await bcrypt.hash(parolaNoua, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
    await db.query("DELETE FROM coduri_resetare_parola WHERE user_id = $1", [user.id]);

    res.json({ message: "Parola a fost schimbată cu succes!" });
  } catch (err) {
    console.error("Eroare confirmare schimbare parolă:", err);
    res.status(500).json({ message: "Eroare server" });
  }
});

app.post("/verifica-cod", async (req, res) => {
  const { email, cod } = req.body;

  try {
    const result = await db.query(`
      SELECT c.*
      FROM coduri_resetare_parola c
      JOIN users u ON u.id = c.user_id
      WHERE u.email = $1 AND c.cod = $2 AND c.expira_la > NOW()
    `, [email, cod]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Cod invalid sau expirat." });
    }

    res.json({ message: "Cod valid." });
  } catch (error) {
    console.error("Eroare verificare cod:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.get("/camine", async (req, res) => {
  try {
    const result = await db.query("SELECT id, nume_camin FROM camine");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching camine:", error);
    res.status(500).send("Eroare de server");
  }
});

app.get("/camere/:caminId", async (req, res) => {
  const caminId = req.params.caminId;
  try {
    const result = await db.query(
      "SELECT id, numar_camera, etaj, numar_paturi FROM camere WHERE camin_id = $1 AND este_disponibila = TRUE",
      [caminId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching camere:", error);
    res.status(500).send("Eroare de server");
  }
});

app.get("/statistici/cereri/:caminId/:etaj?", async (req, res) => {
  const { caminId, etaj } = req.params;
  try {
    let query = `
      SELECT c.id, c.numar_camera, c.etaj, c.numar_paturi,
              COALESCE(SUM(CASE WHEN cerere_cazare.optiune1_camera = c.id THEN 1 ELSE 0 END), 0) AS optiune_1,
              COALESCE(SUM(CASE WHEN cerere_cazare.optiune2_camera = c.id THEN 1 ELSE 0 END), 0) AS optiune_2,
              COALESCE(SUM(CASE WHEN cerere_cazare.optiune3_camera = c.id THEN 1 ELSE 0 END), 0) AS optiune_3
       FROM camere c
       LEFT JOIN cerere_cazare ON 
          cerere_cazare.optiune1_camera = c.id 
          OR cerere_cazare.optiune2_camera = c.id 
          OR cerere_cazare.optiune3_camera = c.id
       WHERE c.camin_id = $1
    `;

    const queryParams = [caminId];

    if (etaj) {
      query += ` AND c.etaj = $2`;
      queryParams.push(parseInt(etaj));
    }

    query += ` GROUP BY c.id, c.numar_camera, c.etaj, c.numar_paturi ORDER BY c.etaj, c.numar_camera`;

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Eroare la preluarea statisticilor cererilor:", error);
    res.status(500).json({ error: "Eroare de server" });
  }
});



app.get("/utilizatori", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }
  try {
    const userId= req.user.id;
    const searchQuery = req.query.q || "";

    const userResult = await db.query("SELECT sex FROM users WHERE id = $1", [userId]);
    const userSex = userResult.rows[0].sex;

    const result = await db.query(
      `SELECT u.id, u.nume, u.prenume, s.facultate, s.specializare, s.grupa
       FROM users u
       LEFT JOIN studenti s ON u.id = s.user_id
       WHERE u.id != $1 
         AND u.sex = $2 
         AND u.administrator = false
         AND (u.nume ILIKE $3 OR u.prenume ILIKE $3)
         AND (s.camera_id IS NULL OR s.camera_id = 0)
       ORDER BY u.nume ASC, u.prenume ASC;
       `,
      [userId, userSex, `${searchQuery}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Eroare de server");
  }
});

app.post("/cereri", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    const { cereri, colegi, acceptRedistribuire } = req.body;
    const userId = req.user.id;

    const existingCerere = await db.query(
      "SELECT id FROM cerere_cazare WHERE user_id = $1",
      [userId]
    );

    if (existingCerere.rows.length > 0) {
      return res.status(400).json({ message: "Ai deja o cerere înregistrată! Nu poți depune mai multe." });
    }

    // Verific dacă există cereri valide
    if (!cereri || cereri.length === 0) {
      return res.status(400).json({ message: "Trebuie să selectați cel puțin o cameră!" });
    }

    // Extrage valorile pentru fiecare opțiune
    const optiune1 = cereri[0] || { caminId: null, cameraId: null };
    const optiune2 = cereri[1] || { caminId: null, cameraId: null };
    const optiune3 = cereri[2] || { caminId: null, cameraId: null };

    // Inserez cererea în baza de date
    await db.query(
      `INSERT INTO cerere_cazare (user_id, colegi, optiune1_camin, optiune1_camera, optiune2_camin, optiune2_camera, optiune3_camin, optiune3_camera, accept_redistribuire) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.user.id,
        colegi.join(","), // Transform array-ul colegilor în string
        optiune1.caminId, optiune1.cameraId,
        optiune2.caminId, optiune2.cameraId,
        optiune3.caminId, optiune3.cameraId,
        acceptRedistribuire
      ]
    );

    res.json({ message: "Cererea a fost înregistrată cu succes!" });

    const userEmail = req.user.email;
    await transporter.sendMail({
      from: `"Cămin@UniTBv" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Confirmare cerere de cazare",
      text: `Salut, ${req.user.prenume} ${req.user.nume}!\n\nCererea ta de cazare a fost înregistrată cu succes.\nVei fi notificat după validare.`
    });

  } catch (error) {
    console.error("❌ Eroare la trimiterea cererii:", error);
    res.status(500).json({ message: "Eroare de server" });
  }
});



passport.use(new Strategy(async function verify(username, password, cb) {
  console.log(username);
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

    if(result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      bcrypt.compare(password, storedPassword, (err, result) => {
        if(err) {
          return cb(err);
        } else {
          if(result) {
            return cb(null, user)
          } else {
            return cb(null, false)
          }
        }
      });
    } else {
      return cb("User not found")
    }
  } catch(err) {
    console.log(err);
  }
})
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const userResult = await db.query(
      "SELECT id, nume, prenume, email, poza_profil, administrator FROM users WHERE id = $1",
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return cb(null, false);
    }
    
    const user = userResult.rows[0];
    
    const studentResult = await db.query(
      "SELECT facultate, specializare, grupa FROM studenti WHERE user_id = $1",
      [id]
    );
    const studentData = studentResult.rows[0] || {};
    
    const userData = {
      ...user,
      facultate: studentData.facultate || null,
      specializare: studentData.specializare || null,
      grupa: studentData.grupa || null ,
      esteAdmin: user.administrator
    };
    
    cb(null, userData);
  } catch (error) {
    cb(error);
  }
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: "Logout successful" });
  });
});

app.post("/upload-profile-pic", uploadProfil.single("pozaProfil"), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Neautorizat" });
  }

  const { telefon } = req.body;
  const imageUrl = req.file ? `/uploads/profil/${req.file.filename}` : null;

  try {
    if (imageUrl) {
      await db.query("UPDATE users SET poza_profil = $1 WHERE id = $2", [imageUrl, req.user.id]);
    }

    if (telefon !== undefined) {
      await db.query("UPDATE studenti SET telefon = $1 WHERE user_id = $2", [telefon, req.user.id]);
    }

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Eroare la salvarea imaginii:", error);
    res.status(500).json({ success: false, message: "Eroare de server" });
  }
});

app.use("/uploads/profil", express.static("uploads/profil"));

app.get("/cereri", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    // Obțin căminul administrat de utilizator
    const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

    if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
      return res.status(403).json({ message: "Nu aveți permisiunea de a vedea aceste cereri." });
    }

    const caminAdmin = adminResult.rows[0].camin_id;

    // Selectez cererile, înlocuind ID-urile colegilor cu numele lor
    const result = await db.query(
      `SELECT c.id, u.nume, u.prenume, c.data_creare, c.accept_redistribuire, 
              CASE WHEN c.optiune1_camin = $1 THEN c.optiune1_camin ELSE NULL END AS optiune1_camin,
              CASE WHEN c.optiune1_camin = $1 THEN cam1.numar_camera ELSE NULL END AS optiune1_camera,
              CASE WHEN c.optiune2_camin = $1 THEN c.optiune2_camin ELSE NULL END AS optiune2_camin,
              CASE WHEN c.optiune2_camin = $1 THEN cam2.numar_camera ELSE NULL END AS optiune2_camera,
              CASE WHEN c.optiune3_camin = $1 THEN c.optiune3_camin ELSE NULL END AS optiune3_camin,
              CASE WHEN c.optiune3_camin = $1 THEN cam3.numar_camera ELSE NULL END AS optiune3_camera,
              (SELECT STRING_AGG(concat(u2.nume, ' ', u2.prenume), ', ')
               FROM users u2
               WHERE string_to_array(c.colegi, ',')::int[] @> ARRAY[u2.id]) AS colegi
       FROM cerere_cazare c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN camere cam1 ON c.optiune1_camera = cam1.id
       LEFT JOIN camere cam2 ON c.optiune2_camera = cam2.id
       LEFT JOIN camere cam3 ON c.optiune3_camera = cam3.id
       WHERE c.optiune1_camin = $1 
          OR c.optiune2_camin = $1 
          OR c.optiune3_camin = $1
       ORDER BY c.data_creare ASC`,
      [caminAdmin]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching cereri:", error);
    res.status(500).send("Eroare de server");
  }
});

app.get("/etaje-si-camere", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    // Obțin căminul administrat de utilizator
    const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

    if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
      return res.status(403).json({ message: "Nu aveți permisiunea de a vedea aceste date." });
    }

    const caminAdmin = adminResult.rows[0].camin_id;

    // Selectez etajele și camerele disponibile pentru acest cămin
    const etajeSiCamere = await db.query(
      `SELECT DISTINCT etaj FROM camere WHERE camin_id = $1 ORDER BY etaj ASC`,
      [caminAdmin]
    );

    const camere = await db.query(
      `SELECT id, numar_camera, etaj FROM camere WHERE camin_id = $1 ORDER BY etaj, numar_camera`,
      [caminAdmin]
    );

    res.json({ etaje: etajeSiCamere.rows, camere: camere.rows });
  } catch (error) {
    console.error("Error fetching etaje si camere:", error);
    res.status(500).send("Eroare de server");
  }
});

app.get("/camine/camere", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

    if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
      return res.status(403).json({ message: "Nu aveți permisiunea de a vedea camerele acestui cămin." });
    }

    const caminAdmin = adminResult.rows[0].camin_id;

    const camere = await db.query(
      `SELECT etaj, numar_camera, numar_paturi, este_disponibila FROM camere WHERE camin_id = $1 ORDER BY etaj, numar_camera`,
      [caminAdmin]
    );

    res.json(camere.rows);
  } catch (error) {
    console.error("Error fetching camere:", error);
    res.status(500).send("Eroare de server");
  }
});

app.put("/cereri/validare", async (req, res) => {
  const { cerereId, optiune } = req.body;

  if (!cerereId || !optiune) {
    return res.status(400).json({ message: "Lipsesc parametrii necesari." });
  }

  try {
    // Obțin datele cererii și colegii
    const cerereResult = await db.query(
      `SELECT c.user_id, u.nume, u.prenume, 
              c.optiune1_camera, c.optiune2_camera, c.optiune3_camera, c.colegi
       FROM cerere_cazare c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [cerereId]
    );

    if (cerereResult.rows.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    const cerere = cerereResult.rows[0];
    const userIdPrincipal = cerere.user_id;
    const studentPrincipal = `${cerere.nume} ${cerere.prenume}`;

    // Aleg numărul camerei din opțiunea selectată
    const numarCamera =
      optiune === "1" ? cerere.optiune1_camera :
      optiune === "2" ? cerere.optiune2_camera :
      optiune === "3" ? cerere.optiune3_camera :
      null;

    if (!numarCamera) {
      return res.status(400).json({ message: "Opțiunea selectată nu conține o cameră validă." });
    }

    const cameraResult = await db.query(
      `SELECT id, camin_id, numar_paturi, student1, student2, student3, student4 
       FROM camere WHERE id = $1`,
      [parseInt(numarCamera, 10)]
    );

    if (cameraResult.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }

    const camera = cameraResult.rows[0];
    const cameraId = camera.id;
    const caminId = camera.camin_id;
    let { numar_paturi, student1, student2, student3, student4 } = camera;

    // Procesăm colegii
    let colegiIds = [];
    let colegiNume = [];
    if (cerere.colegi) {
      colegiIds = cerere.colegi.split(",").map(id => parseInt(id.trim())).filter(Boolean);

      if (colegiIds.length > 0) {
        const colegiResult = await db.query(
          `SELECT CONCAT(nume, ' ', prenume) AS nume_complet FROM users WHERE id = ANY($1)`,
          [colegiIds]
        );
        colegiNume = colegiResult.rows.map(row => row.nume_complet);
      }
    }

    const numarStudenti = colegiNume.length + 1;
    const locuriOcupate = [student1, student2, student3, student4].filter(Boolean).length;
    const locuriRamase = numar_paturi - locuriOcupate;

    if (numarStudenti > locuriRamase) {
      return res.status(400).json({ message: "Camera nu are suficiente locuri disponibile! Validarea a fost anulată." });
    }

    // Alocăm studenții
    const studentiNoi = [studentPrincipal, ...colegiNume];

    if (!student1) student1 = studentiNoi.shift();
    if (!student2 && studentiNoi.length > 0) student2 = studentiNoi.shift();
    if (!student3 && studentiNoi.length > 0) student3 = studentiNoi.shift();
    if (!student4 && studentiNoi.length > 0) student4 = studentiNoi.shift();

    const numarPaturiNou = Math.max(numar_paturi - numarStudenti, 0);
    const esteDisponibila = numarPaturiNou > 0;

    await db.query(
      `UPDATE camere 
       SET student1 = $1, student2 = $2, student3 = $3, student4 = $4, este_disponibila = $5, numar_paturi = $6
       WHERE id = $7`,
      [student1, student2, student3, student4, esteDisponibila, numarPaturiNou, cameraId]
    );

    // Inserăm sau actualizăm studenții în tabela `studenti`
    for (const studentId of [userIdPrincipal, ...colegiIds]) {
      const check = await db.query("SELECT 1 FROM studenti WHERE user_id = $1", [studentId]);
      if (check.rows.length === 0) {
        await db.query(
          `INSERT INTO studenti (user_id, camin_id, camera_id) VALUES ($1, $2, $3)`,
          [studentId, caminId, cameraId]
        );
      } else {
        await db.query(
          `UPDATE studenti SET camin_id = $1, camera_id = $2 WHERE user_id = $3`,
          [caminId, cameraId, studentId]
        );
      }
    }

    const emailResult = await db.query("SELECT email, nume, prenume FROM users WHERE id = $1", [studentId]);
    const user = emailResult.rows[0];

    await transporter.sendMail({
      from: `"Admin Cămin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Cazare confirmată",
      text: `Salut, ${user.prenume} ${user.nume}!\n\nAi fost cazat(ă) cu succes în camera ${camera.numar_camera}.`
    });

    // Ștergem cererea validată + ale colegilor
    await db.query(
      `DELETE FROM cerere_cazare 
       WHERE user_id = $1 
         OR (colegi IS NOT NULL AND string_to_array(colegi, ',')::int[] && $2)`,
      [userIdPrincipal, colegiIds]
    );

    res.json({ message: `Cererea validată! ${numarStudenti} locuri ocupate, ${numarPaturiNou} locuri rămase.` });

  } catch (error) {
    console.error("Eroare la validarea cererii:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});



app.delete("/cereri/:cerereId", async (req, res) => {
  const { cerereId } = req.params;

  if (!cerereId) {
    return res.status(400).json({ message: "Lipseste ID-ul cererii" });
  }

  try {
    //Șterg cererea din baza de date
    const result = await db.query("DELETE FROM cerere_cazare WHERE id = $1 RETURNING *", [cerereId]);

    const userQuery = await db.query(`
      SELECT u.email, u.nume, u.prenume 
      FROM cerere_cazare c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [cerereId]);
    
    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];
      await transporter.sendMail({
        from: `"Cămin@UniTBv" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Cerere de cazare respinsă",
        text: `Salut, ${user.prenume} ${user.nume}!\n\nCererea ta de cazare a fost respinsă.\nPoți încerca o altă opțiune sau poți aștepta redistribuirea.`
      });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită" });
    }

    res.json({ message: "Cererea a fost respinsă și ștearsă cu succes!" });
  } catch (error) {
    console.error("Eroare la respingerea cererii:", error);
    res.status(500).json({ message: "Eroare de server" });
  }
});

app.get("/studenti-redistribuire", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    const result = await db.query(`
      SELECT u.id, u.nume, u.prenume, s.facultate, s.specializare, s.grupa, u.email
      FROM users u
      JOIN cerere_cazare c ON u.id = c.user_id
      LEFT JOIN studenti s ON u.id = s.user_id
      WHERE c.accept_redistribuire = TRUE
      ORDER BY c.data_creare ASC
    `);    

    res.json(result.rows);
  } catch (error) {
    console.error("Eroare la preluarea studenților pentru redistribuire:", error);
    res.status(500).json({ message: "Eroare de server" });
  }
});

app.put("/studenti/cazare", async (req, res) => {
  const { studentId, cameraId } = req.body;

  if (!studentId || !cameraId) {
    return res.status(400).json({ message: "Lipsesc parametrii necesari." });
  }

  try {
    // Verific dacă studentul există
    const studentResult = await db.query("SELECT nume, prenume FROM users WHERE id = $1", [studentId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Studentul nu a fost găsit." });
    }
    const student = `${studentResult.rows[0].nume} ${studentResult.rows[0].prenume}`;

    // Verific dacă camera există și este disponibilă
    const cameraResult = await db.query(
      `SELECT id, numar_paturi, student1, student2, student3, student4 FROM camere WHERE id = $1`,
      [cameraId]
    );
    if (cameraResult.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }

    const camera = cameraResult.rows[0];
    const caminId = camera.camin_id;
    let { numar_paturi, student1, student2, student3, student4 } = camera;

    const locuriInitiale = numar_paturi;

    // Verific dacă există locuri disponibile
    const studentiOcupati = [student1, student2, student3, student4].filter(s => s !== null);
    const locuriRamase = locuriInitiale - studentiOcupati.length;
    
    if (locuriRamase <= 0) {
      return res.status(400).json({ message: "Nu mai sunt locuri disponibile în această cameră!" });
    }

    // Adaug studentul într-un loc liber
    if (!student1) student1 = student;
    else if (!student2) student2 = student;
    else if (!student3) student3 = student;
    else if (!student4) student4 = student;

    // Reduc numărul de paturi disponibile
    const numarPaturiNou = Math.max(numar_paturi - 1, 0);
    const esteDisponibila = numarPaturiNou > 0;

    // Actualizez camera
    await db.query(
      `UPDATE camere 
       SET student1 = $1, student2 = $2, student3 = $3, student4 = $4, numar_paturi = $5, este_disponibila = $6
       WHERE id = $7`,
      [student1, student2, student3, student4, numarPaturiNou, esteDisponibila, cameraId]
    );

    await db.query(
      `UPDATE studenti 
       SET camin_id = $1, camera_id = $2 
       WHERE user_id = $3`,
      [caminId, cameraId, studentId]
    );

    // Șterg studentul din lista de redistribuire
    await db.query("DELETE FROM cerere_cazare WHERE user_id = $1", [studentId]);

    res.json({ message: `Studentul ${student} a fost cazat cu succes în camera ${cameraId}!` });

  } catch (error) {
    console.error("Eroare la cazarea manuală:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

app.get("/camine/camere-disponibile", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

    if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
      return res.status(403).json({ message: "Nu aveți permisiunea de a vedea camerele acestui cămin." });
    }

    const caminAdmin = adminResult.rows[0].camin_id;

    const camere = await db.query(
      `SELECT id, numar_camera, numar_paturi 
       FROM camere 
       WHERE camin_id = $1 AND este_disponibila = TRUE AND numar_paturi > 0
       ORDER BY numar_camera`,
      [caminAdmin]
    );

    res.json(camere.rows);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ message: "Eroare de server" });
  }
});

app.get("/cereri/export-excel", async (req, res) => {
  if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
      const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

      if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
          return res.status(403).json({ message: "Nu aveți permisiunea de a vedea aceste cereri." });
      }

      const caminAdmin = adminResult.rows[0].camin_id;

      const result = await db.query(`
          SELECT c.id, u.nume, u.prenume, c.data_creare, c.accept_redistribuire,
                 c.optiune1_camin, cam1.numar_camera AS optiune1_camera,
                 c.optiune2_camin, cam2.numar_camera AS optiune2_camera,
                 c.optiune3_camin, cam3.numar_camera AS optiune3_camera,
                 (SELECT STRING_AGG(concat(u2.nume, ' ', u2.prenume), ', ')
                  FROM users u2
                  WHERE string_to_array(c.colegi, ',')::int[] @> ARRAY[u2.id]) AS colegi
          FROM cerere_cazare c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN camere cam1 ON c.optiune1_camera = cam1.id
          LEFT JOIN camere cam2 ON c.optiune2_camera = cam2.id
          LEFT JOIN camere cam3 ON c.optiune3_camera = cam3.id
          WHERE c.optiune1_camin = $1 
             OR c.optiune2_camin = $1 
             OR c.optiune3_camin = $1
          ORDER BY c.data_creare ASC
      `, [caminAdmin]);

      const cereri = result.rows;

      if (cereri.length === 0) {
          return res.status(404).json({ message: "Nu există cereri disponibile pentru export." });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cereri Cazare");

      worksheet.columns = [
          { header: "ID Cerere", key: "id", width: 10 },
          { header: "Nume", key: "nume", width: 20 },
          { header: "Prenume", key: "prenume", width: 20 },
          { header: "Optiune 1", key: "optiune1", width: 30 },
          { header: "Optiune 2", key: "optiune2", width: 30 },
          { header: "Optiune 3", key: "optiune3", width: 30 },
          { header: "Colegi", key: "colegi", width: 50 },
          { header: "Data și Ora", key: "data_creare", width: 20 },
          { header: "Redistribuire", key: "accept_redistribuire", width: 15 },
      ];

      cereri.forEach((cerere) => {
          worksheet.addRow({
              id: cerere.id,
              nume: cerere.nume,
              prenume: cerere.prenume,
              optiune1: cerere.optiune1_camera
                  ? `Cămin ${cerere.optiune1_camin} - Camera ${cerere.optiune1_camera}`
                  : "-",
              optiune2: cerere.optiune2_camera
                  ? `Cămin ${cerere.optiune2_camin} - Camera ${cerere.optiune2_camera}`
                  : "-",
              optiune3: cerere.optiune3_camera
                  ? `Cămin ${cerere.optiune3_camin} - Camera ${cerere.optiune3_camera}`
                  : "-",
              colegi: cerere.colegi || "-",
              data_creare: new Date(cerere.data_creare).toLocaleString("ro-RO"),
              accept_redistribuire: cerere.accept_redistribuire ? "Da" : "Nu",
          });
      });

      res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const dateObj = new Date();
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const currentDate = `${day}-${month}-${year}`;
      
      const fileName = `Cereri_Cazare_${currentDate}.xlsx`;
      
      res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
      );

      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error("Eroare la generarea fișierului Excel:", error);
      res.status(500).json({ message: "Eroare internă la generarea fișierului Excel." });
  }
});

app.get("/export/camere-excel", async (req, res) => {
  if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
      // Obținem ID-ul căminului administrat de utilizator
      const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);

      if (adminResult.rows.length === 0 || !adminResult.rows[0].camin_id) {
          return res.status(403).json({ message: "Nu aveți permisiunea de a vedea aceste date." });
      }

      const caminAdmin = adminResult.rows[0].camin_id;

      // Obținem **numele** căminului din tabelul `camine`
      const caminResult = await db.query("SELECT nume_camin FROM camine WHERE id = $1", [caminAdmin]);
      const numeCamin = caminResult.rows.length > 0 ? caminResult.rows[0].nume_camin.replace(/\s+/g, "_") : `Camin_${caminAdmin}`;

      // Obținem data curentă în format YYYY-MM-DD
      const dataExport = new Date().toISOString().split("T")[0];

      const result = await db.query(`
          SELECT numar_camera, etaj, numar_paturi, 
                 CASE WHEN este_disponibila THEN 'Da' ELSE 'Nu' END AS disponibilitate,
                 student1, student2, student3, student4
          FROM camere WHERE camin_id = $1 ORDER BY etaj, numar_camera
      `, [caminAdmin]);

      const camere = result.rows;

      if (camere.length === 0) {
          return res.status(404).json({ message: "Nu există camere disponibile pentru export." });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Camere Cămin");

      worksheet.columns = [
          { header: "Număr Cameră", key: "numar_camera", width: 15 },
          { header: "Etaj", key: "etaj", width: 10 },
          { header: "Număr Paturi", key: "numar_paturi", width: 15 },
          { header: "Disponibilitate", key: "disponibilitate", width: 15 },
          { header: "Student 1", key: "student1", width: 20 },
          { header: "Student 2", key: "student2", width: 20 },
          { header: "Student 3", key: "student3", width: 20 },
          { header: "Student 4", key: "student4", width: 20 }
      ];

      camere.forEach((camera) => {
          worksheet.addRow({
              numar_camera: camera.numar_camera,
              etaj: camera.etaj,
              numar_paturi: camera.numar_paturi,
              disponibilitate: camera.disponibilitate,
              student1: camera.student1 || "-",
              student2: camera.student2 || "-",
              student3: camera.student3 || "-",
              student4: camera.student4 || "-"
          });
      });

      const dateObj = new Date();
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const currentDate = `${day}-${month}-${year}`;
      
      const fileName = `Camere_${numeCamin}_${currentDate}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error("Eroare la generarea fișierului Excel:", error);
      res.status(500).json({ message: "Eroare internă la generarea fișierului Excel." });
  }
});

app.get("/anunturi", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM anunturi ORDER BY data DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Eroare la preluarea anunțurilor:", error);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.post("/anunturi", async (req, res) => {
  try {
    const { text, importanta } = req.body;
    if (!text) return res.status(400).json({ error: "Textul este necesar" });

    const importantaValidata = ["critică", "medie", "scăzută"].includes(importanta) ? importanta : "medie";

    const result = await db.query(
      "INSERT INTO anunturi (text, importanta) VALUES ($1, $2) RETURNING *",
      [text, importantaValidata]
    );

    await trimiteNotificareGlobala(
      "Anunț nou în avizier",
      "Un administrator a publicat un nou anunț în avizierul digital.",
      "avizier",
      null,
      result.rows[0].id
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Eroare la adăugarea anunțului:", error);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.delete("/anunturi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM anunturi WHERE id = $1", [id]);
    await db.query("DELETE FROM notificari_globale WHERE id_anunt_admin = $1", [id]);
    res.json({ message: "Anunț șters cu succes" });
  } catch (error) {
    console.error("Eroare la ștergerea anunțului:", error);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.put("/anunturi/:id", async (req, res) => {
  const { id } = req.params;
  const { text, importanta, fixat } = req.body;

  try {
    const importantaValidata = ["critică", "medie", "scăzută"].includes(importanta) ? importanta : "medie";

    const result = await db.query(
      `UPDATE anunturi 
       SET text = $1, importanta = $2, fixat = $3
       WHERE id = $4
       RETURNING *`,
      [text, importantaValidata, fixat ?? false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Anunțul nu a fost găsit." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Eroare la actualizarea anunțului:", error);
    res.status(500).json({ message: "Eroare server" });
  }
});


const getLunaCurenta = () => {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

app.get("/camin-student", async (req, res) => {
  if (!req.isAuthenticated()) {
      return res.status(401).json({ caminId: null, message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
      const result = await db.query("SELECT camin_id FROM studenti WHERE user_id = $1", [req.user.id]);

      if (result.rows.length === 0) {
          return res.json({ caminId: null, message: "Utilizatorul nu este cazat în niciun cămin." });
      }

      res.json({ caminId: result.rows[0].camin_id });
  } catch (error) {
      console.error("Eroare la obținerea căminului studentului:", error);
      res.status(500).json({ caminId: null, message: "Eroare de server" });
  }
});


app.post("/feedback", async (req, res) => {
  const { caminId, curatenie, facilitati, zgomot, internet, personal_administrativ, securitate, comentarii } = req.body;
  const lunaRecenzie = getLunaCurenta();

  try {
      const result = await db.query(
          `INSERT INTO recenzii_camine (camin_id, curatenie, facilitati, zgomot, internet, personal_administrativ, securitate, comentarii, luna_recenzie) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [caminId, curatenie, facilitati, zgomot, internet, personal_administrativ, securitate, comentarii, lunaRecenzie]
      );
      res.status(201).json({ mesaj: "Recenzie trimisă cu succes!", recenzie: result.rows[0] });
  } catch (error) {
      console.error("Eroare la salvarea recenziei:", error);
      res.status(500).json({ eroare: "Eroare la trimiterea recenziei" });
  }
});

app.get("/statistici-recenzii", async (req, res) => {
  try {
      const result = await db.query(`
          SELECT 
              luna_recenzie,
              AVG(curatenie) AS curatenie,
              AVG(facilitati) AS facilitati,
              AVG(zgomot) AS zgomot,
              AVG(internet) AS internet,
              AVG(personal_administrativ) AS personal_administrativ,
              AVG(securitate) AS securitate
          FROM recenzii_camine
          WHERE luna_recenzie >= TO_CHAR((CURRENT_DATE - INTERVAL '6 months'), 'YYYY-MM')
          GROUP BY luna_recenzie
          ORDER BY luna_recenzie ASC
      `);

      res.json(result.rows);
  } catch (error) {
      console.error("Eroare la obținerea statisticilor:", error);
      res.status(500).json({ mesaj: "Eroare la server." });
  }
});

app.get("/camera-me", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  try {
    // 1️⃣ Obținem ID-ul camerei utilizatorului autentificat
    const cameraQuery = await db.query(
      "SELECT camera_id FROM studenti WHERE user_id = $1",
      [req.user.id]
    );

    if (cameraQuery.rows.length === 0 || !cameraQuery.rows[0].camera_id) {
      return res.json({ message: "Studentul nu este cazat într-o cameră." });
    }

    const cameraId = cameraQuery.rows[0].camera_id;

    const studentQuery = await db.query(
      `SELECT camin_id FROM studenti WHERE user_id = $1`,
      [req.user.id]
    );

    // 2️⃣ Obținem informațiile camerei
    const cameraInfo = await db.query(
      `SELECT c.numar_camera, ca.nume_camin 
       FROM camere c
       JOIN camine ca ON c.camin_id = ca.id
       WHERE c.id = $1`,
      [cameraId]
    );

    if (cameraInfo.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }

    // 3️⃣ Obținem colegii de cameră din `users`
    const colegiUsersQuery = await db.query(
      `SELECT id, nume, prenume, email FROM users 
       WHERE id IN (
         SELECT user_id FROM studenti WHERE camera_id = $1 AND user_id != $2
       )`,
      [cameraId, req.user.id]
    );

    if (colegiUsersQuery.rows.length === 0) {
      return res.json({
        camin_id: studentQuery.rows[0].camin_id,
        camin: cameraInfo.rows[0].nume_camin,
        numar_camera: cameraInfo.rows[0].numar_camera,
        colegi: []
      });
    }

    // 4️⃣ Obținem facultatea, specializarea și grupa pentru fiecare coleg folosind un JOIN
    const colegiIds = colegiUsersQuery.rows.map(coleg => coleg.id);
    const colegiDetailsQuery = await db.query(
      `SELECT s.user_id, s.facultate, s.specializare, s.grupa, 
              u.nume, u.prenume, u.email
       FROM studenti s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ANY($1)`,
      [colegiIds]
    );

    return res.json({
      camin: cameraInfo.rows[0].nume_camin,
      numar_camera: cameraInfo.rows[0].numar_camera,
      colegi: colegiDetailsQuery.rows
    });
  } catch (error) {
    console.error("Eroare la preluarea detaliilor camerei:", error);
    return res.status(500).json({ message: "Eroare de server" });
  }
});

app.get("/profil-coleg/:nume", async (req, res) => {
  const { nume } = req.params;

  try {
      // Obținem informațiile utilizatorului
      const result = await db.query(
          `SELECT u.id, u.nume, u.prenume, u.email, u.poza_profil, 
                  s.facultate, s.specializare, s.grupa, s.telefon, s.camera_id, s.descriere, s.sporturi_preferate, s.hobby_uri
           FROM users u
           LEFT JOIN studenti s ON u.id = s.user_id
           WHERE LOWER(u.nume) = LOWER($1)`,
          [nume]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
      }

      res.json(result.rows[0]);
  } catch (error) {
      console.error("Eroare la preluarea profilului colegului:", error);
      res.status(500).json({ message: "Eroare de server." });
  }
});

app.get("/camera-coleg/:nume", async (req, res) => {
  const { nume } = req.params;

  try {
      // 1️⃣ Găsim ID-ul camerei și căminului colegului
      const studentQuery = await db.query(
          `SELECT s.camera_id, s.camin_id, u.id AS user_id
           FROM studenti s
           JOIN users u ON s.user_id = u.id
           WHERE LOWER(u.nume) = LOWER($1)`,
          [nume]
      );

      if (studentQuery.rows.length === 0) {
          return res.status(404).json({ message: "Coleg fără cameră asignată." });
      }

      const { camera_id, camin_id, user_id } = studentQuery.rows[0];

      // 2️⃣ Găsim detaliile camerei
      const cameraQuery = await db.query(
          `SELECT c.numar_camera, ca.nume_camin
           FROM camere c
           JOIN camine ca ON c.camin_id = ca.id
           WHERE c.id = $1 AND c.camin_id = $2`,
          [camera_id, camin_id]
      );

      if (cameraQuery.rows.length === 0) {
          return res.status(404).json({ message: "Detaliile camerei nu au fost găsite." });
      }

      // 3️⃣ Găsim colegii de cameră cu detalii complete
      const colegiQuery = await db.query(
          `SELECT u.id, u.nume, u.prenume, u.email, s.facultate, s.specializare, s.grupa
           FROM studenti s
           JOIN users u ON s.user_id = u.id
           WHERE s.camera_id = $1 AND s.user_id != $2`,
          [camera_id, user_id]
      );

      res.json({
          camin: cameraQuery.rows[0].nume_camin,
          numar_camera: cameraQuery.rows[0].numar_camera,
          colegi: colegiQuery.rows
      });

  } catch (error) {
      console.error("Eroare la preluarea detaliilor camerei colegului:", error);
      res.status(500).json({ message: "Eroare de server." });
  }
});

app.put("/profil/actualizare", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat. Vă rugăm să vă autentificați." });
  }

  const { descriere, sporturi_preferate, hobby_uri } = req.body;

  const limitWords = (text, maxWords) => {
      return text ? text.split(/\s+/).slice(0, maxWords).join(" ") : "";
  };

  const descriereLimitata = limitWords(descriere, 50);

  try {
    await db.query(
      `UPDATE studenti 
       SET descriere = $1, sporturi_preferate = $2, hobby_uri = $3
       WHERE user_id = $4`,
      [descriereLimitata, sporturi_preferate, hobby_uri, req.user.id]
    );

    res.json({ message: "Profil actualizat cu succes!" });
  } catch (error) {
    console.error("Eroare la actualizarea profilului:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

app.get("/feedback/comentarii", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.administrator) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  try {
    const result = await db.query(`
      SELECT comentarii, luna_recenzie
      FROM recenzii_camine
      WHERE comentarii IS NOT NULL AND TRIM(comentarii) <> ''
      ORDER BY luna_recenzie DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Eroare la preluarea comentariilor:", error);
    res.status(500).json({ mesaj: "Eroare de server." });
  }
});

app.get("/camine/camere-cu-studenti", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.administrator) {
    return res.status(403).json({ message: "Acces interzis." });
  }

  try {
    const adminResult = await db.query("SELECT camin_id FROM administratori WHERE user_id = $1", [req.user.id]);
    if (adminResult.rows.length === 0) {
      return res.status(403).json({ message: "Nu administrați niciun cămin." });
    }

    const caminId = adminResult.rows[0].camin_id;

    const camere = await db.query(`
      SELECT id, numar_camera, etaj, student1, student2, student3, student4
      FROM camere
      WHERE camin_id = $1
      ORDER BY etaj, numar_camera
    `, [caminId]);

    res.json(camere.rows);
  } catch (error) {
    console.error("Eroare la preluarea camerelor:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.get("/studenti/camere", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat." });
  }

  try {
    const result = await db.query(
      `SELECT camin_id FROM studenti WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Nu ești cazat în niciun cămin." });
    }

    const caminId = result.rows[0].camin_id;

    const camere = await db.query(`
      SELECT id, numar_camera, etaj, student1, student2, student3, student4
      FROM camere
      WHERE camin_id = $1
      ORDER BY etaj, numar_camera
    `, [caminId]);

    res.json(camere.rows);
  } catch (error) {
    console.error("Eroare la camere student:", error);
    res.status(500).json({ message: "Eroare server" });
  }
});

app.post("/mesaj-student", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautentificat." });
  }

  const { destinatar, subiect, mesaj } = req.body;

  if (!destinatar || !subiect || !mesaj) {
    return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
  }

  try {
    let camera = "necunoscuta";
    let fromName = `${req.user.prenume} ${req.user.nume}`;

    if (!req.user.administrator) {
      const cameraQuery = await db.query(
        `SELECT c.numar_camera
         FROM studenti s
         JOIN camere c ON s.camera_id = c.id
         WHERE s.user_id = $1`,
        [req.user.id]
      );
      camera = cameraQuery.rows[0]?.numar_camera || "necunoscută";
      fromName += ` (Camera ${camera})`;
    } else {
      fromName += " (Administrator)";
    }

    const mailOptions = {
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to: destinatar,
    subject: subiect,
    text: mesaj,
  };
    await transporter.sendMail(mailOptions);
    res.json({ message: "Mesajul a fost trimis cu succes!" });

  } catch (error) {
    console.error("Eroare la trimiterea emailului:", error);
    res.status(500).json({ message: "Eroare la trimiterea mesajului." });
  }
});

app.get("/sesizari-user", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautentificat." });
  }

  try {
    const result = await db.query(
      `SELECT id, titlu, descriere, status, data_trimitere, data_update, imagine
       FROM sesizari
       WHERE student_id = $1
       ORDER BY data_trimitere DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Eroare la preluarea sesizărilor:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

app.get("/sesizari-admin", isAdmin, async (req, res) => {
  try {
    const admin = await db.query(
      `SELECT camin_id FROM administratori WHERE user_id = $1`,
      [req.user.id]
    );

    const caminId = admin.rows[0]?.camin_id;
    if (!caminId) return res.status(403).json({ mesaj: "Nu aveți acces." });

    const result = await db.query(
      `SELECT s.id, s.titlu, s.descriere, s.status, s.data_trimitere, s.data_update, s.imagine, s.notita_admin,
              u.nume || ' ' || u.prenume AS nume_student,
              u.email
       FROM sesizari s
       JOIN studenti st ON s.student_id = st.user_id
       JOIN users u ON st.user_id = u.id
       WHERE st.camin_id = $1
       ORDER BY s.data_trimitere DESC`,
      [caminId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Eroare sesizari-admin:", err);
    res.status(500).json({ mesaj: "Eroare server." });
  }
});

app.put("/sesizari-admin/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      `UPDATE sesizari SET status = $1, data_update = NOW() WHERE id = $2`,
      [status, id]
    );
    const sesizare = await db.query(
      `SELECT student_id FROM sesizari WHERE id = $1`,
      [id]
    );

    if (sesizare.rows.length > 0) {
      const studentId = sesizare.rows[0].student_id;

      // 3️⃣ Trimite notificare studentului
      await trimiteNotificare(
        studentId,
        "Sesizare actualizată",
        `Sesizarea ta a fost actualizată cu statusul: "${status}".`,
        "sesizare"
      );
    }

    res.json({ message: "Status sesizare actualizat și notificare trimisă." });
  } catch (err) {
    console.error("Eroare actualizare status:", err);
    res.status(500).json({ mesaj: "Eroare de server." });
  }
});

app.delete("/sesizari/:id" ,async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM sesizari WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Sesizarea nu a fost găsită." });
    }

    res.json({ message: "Sesizarea a fost ștearsă cu succes." });
  } catch (error) {
    console.error("Eroare la ștergerea sesizării:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});


app.post("/sesizari", uploadSesizari.array("imagini",5), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautentificat." });
  }

  const { titlu, descriere } = req.body;

  // 🛑 Verifică dacă titlu și descriere există
  if (!titlu || !descriere) {
    return res.status(400).json({ message: "Titlul și descrierea sunt obligatorii." });
  }

  const imaginePaths = req.files.map((file) => `/uploads/sesizari/${file.filename}`);
  const imaginiConcat = imaginePaths.join(","); // salvăm ca string separat prin virgulă

  try {
    await db.query(
      `INSERT INTO sesizari (student_id, titlu, descriere, imagine) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, titlu, descriere, imaginiConcat]
    );

    const result = await db.query(`
      SELECT camin_id FROM studenti WHERE user_id = $1
    `, [req.user.id]);
    
    console.log("🎓 Camin ID găsit:", result.rows[0]?.camin_id);
    
    if (result.rows.length > 0) {
      const caminId = result.rows[0].camin_id;
    
      // 2️⃣ Găsim user_id-ul administratorului acelui cămin
      const adminResult = await db.query(`
        SELECT user_id FROM administratori WHERE camin_id = $1
      `, [caminId]);
    
      console.log("👮‍♂️ Admin găsit:", adminResult.rows);
    
      if (adminResult.rows.length > 0) {
        const adminUserId = adminResult.rows[0].user_id;
    
        // 3️⃣ Trimitem notificarea
        await trimiteNotificare(
          adminUserId,
          "Sesizare nouă",
          "Exista o nouă sesizare de la un student din căminul tău.",
          "sesizare"
        );
    
        console.log("✅ Notificare trimisă către admin cu user_id:", adminUserId);
      } else {
        console.log("⚠️ Nu s-a găsit administrator pentru căminul:", caminId);
      }
    }

    res.status(201).json({ message: "Sesizarea a fost înregistrată." });
  } catch (error) {
    console.error("Eroare la trimiterea sesizării:", error);
    res.status(500).json({ message: "Eroare la salvarea sesizării." });
  }
});

app.put("/sesizari/:id", uploadSesizari.single("imagine"), async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Neautentificat." });

  const { id } = req.params;
  const { titlu, descriere } = req.body;
  const imaginePath = req.file ? `/uploads/sesizari/${req.file.filename}` : null;

  try {
    const verificare = await db.query(
      "SELECT * FROM sesizari WHERE id = $1 AND student_id = $2",
      [id, req.user.id]
    );

    if (verificare.rows.length === 0 || verificare.rows[0].status !== "neprocesata") {
      return res.status(403).json({ message: "Nu poți edita această sesizare." });
    }

    await db.query(
      `UPDATE sesizari 
       SET titlu = $1, descriere = $2, imagine = COALESCE($3, imagine)
       WHERE id = $4`,
      [titlu, descriere, imaginePath, id]
    );

    res.json({ message: "Sesizarea a fost actualizată." });
  } catch (error) {
    console.error("Eroare la editarea sesizării:", error);
    res.status(500).json({ message: "Eroare de server" });
  }
});

app.delete("/sesizari/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Neautentificat." });

  const { id } = req.params;

  try {
    const verificare = await db.query(
      "SELECT * FROM sesizari WHERE id = $1 AND student_id = $2",
      [id, req.user.id]
    );

    if (verificare.rows.length === 0 || verificare.rows[0].status !== "neprocesata") {
      return res.status(403).json({ message: "Nu poți șterge această sesizare." });
    }

    await db.query("DELETE FROM sesizari WHERE id = $1", [id]);
    res.json({ message: "Sesizarea a fost ștearsă." });
  } catch (error) {
    console.error("Eroare la ștergerea sesizării:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.use("/uploads/sesizari", express.static("uploads/sesizari"));


app.get("/sesizari/export-excel", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.esteAdmin) {
    return res.status(403).json({ message: "Acces interzis." });
  }

  try {
    const admin = await db.query(
      `SELECT camin_id FROM administratori WHERE user_id = $1`,
      [req.user.id]
    );

    const caminId = admin.rows[0]?.camin_id;
    if (!caminId) return res.status(403).json({ message: "Nu ai acces la un cămin." });

    const result = await db.query(
      `SELECT s.id, s.titlu, s.descriere, s.status, s.data_trimitere, s.data_update,
              u.nume || ' ' || u.prenume AS nume_student
       FROM sesizari s
       JOIN studenti st ON s.student_id = st.user_id
       JOIN users u ON st.user_id = u.id
       WHERE st.camin_id = $1
       ORDER BY s.data_trimitere DESC`,
      [caminId]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sesizări");

    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Student", key: "nume_student", width: 25 },
      { header: "Titlu", key: "titlu", width: 30 },
      { header: "Descriere", key: "descriere", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Trimis la", key: "data_trimitere", width: 20 },
      { header: "Actualizat la", key: "data_update", width: 20 },
    ];

    result.rows.forEach((row) => {
      worksheet.addRow({
        ...row,
        data_trimitere: new Date(row.data_trimitere).toLocaleString("ro-RO"),
        data_update: row.data_update
          ? new Date(row.data_update).toLocaleString("ro-RO")
          : "—",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Sesizari_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Eroare la export sesizări:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.put("/sesizari/:id/notita", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.esteAdmin) {
    return res.status(403).json({ message: "Acces interzis." });
  }

  const { id } = req.params;
  const { notita } = req.body;

  try {
    await db.query(
      `UPDATE sesizari SET notita_admin = $1 WHERE id = $2`,
      [notita, id]
    );
    res.json({ message: "Notița a fost salvată." });
  } catch (err) {
    console.error("Eroare notiță admin:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.post("/sesizari/email", async (req, res) => {
  const { email, subiect, mesaj } = req.body;

  if (!email || !subiect || !mesaj) {
    return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
  }

  try {
    await transporter.sendMail({
      from: `"Cămin@UniTBv Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subiect,
      text: mesaj,
    });

    res.status(200).json({ message: "Email trimis." });
  } catch (err) {
    console.error("Eroare email:", err);
    res.status(500).json({ message: "Eroare la trimitere email." });
  }
});

app.get("/resurse", async (req, res) => {
  const { tip } = req.query;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautorizat." });
  }

  try {
    const result = await db.query(
      `SELECT id, nume, locatie FROM resurse WHERE tip = $1`,
      [tip]
    );
    res.json(result.rows); // ⚠️ frontend-ul se așteaptă la un array
  } catch (err) {
    console.error("Eroare la preluarea resurselor:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// 📆 programările existente pentru o resursă într-o zi
app.get("/programari", async (req, res) => {
  const { start, end, id_resursa } = req.query;
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Neautentificat" });

  try {
    const result = await db.query(
      "SELECT ora_start, data FROM programari_resurse WHERE data BETWEEN $1 AND $2 AND id_resursa = $3",
      [start, end, id_resursa]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la programari:", err);
    res.status(500).json({ message: "Eroare de server" });
  }
});


// 📋 programările proprii ale studentului
app.get("/programari/me", async (req, res) => {
  const { start, end, id_resursa } = req.query;
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Neautentificat" });

  try {
    let query = `
      SELECT p.id, p.ora_start, p.data, r.nume AS nume_resursa
      FROM programari_resurse p
      JOIN resurse r ON p.id_resursa = r.id
      WHERE p.id_student = $1 AND p.data BETWEEN $2 AND $3
    `;
    const params = [req.user.id, start, end];

    if (id_resursa) {
      query += " AND p.id_resursa = $4";
      params.push(parseInt(id_resursa, 10));
    }

    query += " ORDER BY p.data, p.ora_start";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la programari/me:", err);
    res.status(500).json({ message: "Eroare de server" });
  }
});



// ➕ adăugare programare
app.post("/programari", async (req, res) => {
  const { id_resursa, data, ora_start, durata_minute } = req.body;
  const id_student = req.user?.id;

  if (!id_student || !id_resursa || !data || !ora_start) {
    return res.status(400).json({ message: "Datele sunt incomplete sau invalide." });
  }

  try {
    const conflict = await db.query(`
      SELECT * FROM programari_resurse
      WHERE id_resursa = $1
        AND data = $2
        AND (
          ($3::time, ($3::time + ($4 || ' minutes')::interval))
          OVERLAPS
          (ora_start, ora_start + (durata_minute || ' minutes')::interval)
        )
    `, [id_resursa, data, ora_start, durata_minute]);
    
    if (conflict.rowCount > 0) {
      return res.status(409).json({ message: "Slotul se suprapune cu o altă programare" });
    }

    const result = await db.query(`
      INSERT INTO programari_resurse (id_resursa, id_student, data, ora_start, durata_minute)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [id_resursa, id_student, data, ora_start, durata_minute]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Eroare la programare:", err);
    res.status(500).json({ message: "Eroare de server" });
  }
});


// ❌ ștergere programare proprie
app.delete("/programari/:id", async (req, res) => {
  const { id } = req.params;
  const id_student = req.user?.id;
  if (!id_student) return res.status(401).json({ message: "Neautentificat" });

  try {
    await db.query(
      "DELETE FROM programari_resurse WHERE id = $1 AND id_student = $2",
      [id, id_student]
    );
    res.status(204).send();
  } catch (err) {
    console.error("Eroare la ștergere programare:", err);
    res.status(500).json({ message: "Eroare server" });
  }
});

app.post("/api/chatbot", async (req, res) => {
  try {
    const flaskRes = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: req.body.message }),
    });

    const data = await flaskRes.json();
    res.json({ reply: data.response });
  } catch (error) {
    console.error("Eroare proxy către Flask:", error);
    res.status(500).json({ reply: "Eroare la serverul NLP." });
  }
});

app.get("/forum-studenti", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT f.*, u.nume, u.prenume
      FROM anunturi_studenti f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.data_postare DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Eroare la GET /forum-studenti:", err);
    res.status(500).json({ message: "Eroare server" });
  }
});

app.post("/forum-studenti", uploadForum.single("imagine"), async (req, res) => {
  const { titlu, descriere, categorie, dataExpirare, afiseazaContact } = req.body;
  const imagine = req.file ? req.file.filename : null;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Neautentificat." });

  try {
    await db.query(
      `INSERT INTO anunturi_studenti 
       (titlu, descriere, categorie, imagine, data_expirare, afiseaza_contact, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [titlu, descriere, categorie, imagine, dataExpirare, afiseazaContact, userId]
    );
    
    const rezultatAnunt = await db.query(`
      SELECT f.*, u.nume, u.prenume
      FROM anunturi_studenti f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = (SELECT MAX(id) FROM anunturi_studenti WHERE user_id = $1)
    `, [userId]);

    const anuntId = rezultatAnunt.rows[0].id;

    await trimiteNotificareGlobala(
      "Anunț nou în forum",
      `${req.user.prenume} ${req.user.nume} a postat un anunț nou: "${titlu}".`,
      "forum", 
      anuntId
    );

    const rezultat = await db.query(`
      SELECT f.*, u.nume, u.prenume
      FROM anunturi_studenti f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = (SELECT MAX(id) FROM anunturi_studenti WHERE user_id = $1)
    `, [userId]);

    const caminQuery = await db.query(
      `SELECT camin_id FROM studenti WHERE user_id = $1`,
      [req.user.id]
    );
    
    if (caminQuery.rows.length > 0) {
      const caminId = caminQuery.rows[0].camin_id;
    
      // 🔍 Caută administratorul acelui cămin
      const adminQuery = await db.query(
        `SELECT user_id FROM administratori WHERE camin_id = $1`,
        [caminId]
      );
    
      if (adminQuery.rows.length > 0) {
        const adminId = adminQuery.rows[0].user_id;
    
        // 🔔 Trimite notificare către admin
        await trimiteNotificare(
          adminId,
          "Anunț nou postat",
          "Un student a postat un anunț în forumul căminului. Verifică dacă respectă regulile.",
          "forum"
        );
      }
    }
    
    res.status(201).json({ anunt: rezultat.rows[0] });
  } catch (err) {
    console.error("Eroare la POST /forum-studenti:", err);
    res.status(500).json({ message: "Eroare server" });
  }
});

app.delete("/forum-studenti/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const esteAdmin = req.user?.administrator;
  const motiv = req.body?.motiv;

  if (!userId) {
    return res.status(401).json({ message: "Neautentificat." });
  }

  try {
    const anunt = await db.query(
      `SELECT a.user_id, u.email, u.nume, u.prenume
       FROM anunturi_studenti a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (anunt.rows.length === 0) {
      return res.status(404).json({ message: "Anunțul nu există." });
    }

    const autorId = anunt.rows[0].user_id;

    // Verificăm permisiunea
    if (autorId !== userId && !esteAdmin) {
      return res.status(403).json({ message: "Nu ai permisiunea să ștergi acest anunț." });
    }
    await db.query("DELETE FROM notificari_globale WHERE id_anunt_student = $1", [id]);
    await db.query("DELETE FROM anunturi_studenti WHERE id = $1", [id]);

    // Dacă e admin și avem motiv, trimitem email
    if (esteAdmin && motiv) {
      const { email, nume, prenume } = anunt.rows[0];
      const mailOptions = {
        from: `"Admin Cămin@UniTBv" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Anunțul tău a fost șters de un administrator",
        text: `Salut, ${prenume} ${nume}!\n\nAnunțul tău postat pe platforma Cămin@UniTBv a fost șters de un administrator.\n\nMotivul:\n${motiv}\n\nTe rugăm să respecți regulile comunității când postezi în forum.`,
      };

      await transporter.sendMail(mailOptions);

      await trimiteNotificare(
        autorId,
        "Anunț șters de administrator",
        `Anunțul tău a fost șters de un administrator. Motiv: ${motiv}`,
        "forum"
      );
    }

    res.status(200).json({ message: "Anunț șters cu succes." });
  } catch (err) {
    console.error("Eroare la ștergere anunț:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});


app.use("/uploads/forum", express.static("uploads/forum"));

app.get("/notificari/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await db.query(
      `SELECT * FROM notificari WHERE user_id = $1 ORDER BY data DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Eroare la GET notificari:", err);
    res.status(500).json({ message: "Eroare la încărcarea notificărilor." });
  }
});

app.patch("/notificari/:id/citita", async (req, res) => {
  const notificareId = req.params.id;

  try {
    await db.query(
      `UPDATE notificari SET citita = true WHERE id = $1`,
      [notificareId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Eroare la actualizarea notificării:", err);
    res.status(500).json({ message: "Eroare la actualizarea notificării." });
  }
});

app.get("/notificari-globale", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notificari_globale ORDER BY data DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la notificări globale:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

app.delete("/notificari-globale/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM notificari_globale WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notificare globală nu a fost găsită." });
    }
    res.status(200).json({ message: "Notificare globală ștearsă." });
  } catch (err) {
    console.error("Eroare la ștergerea notificării globale:", err);
    res.status(500).json({ message: "Eroare de server." });
  }
});

app.get("/contact-administratie", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Neautentificat." });
  }

  try {
    // 1️⃣ Luăm camin_id al studentului din users
    const userCamin = await db.query(
      `SELECT camin_id FROM studenti WHERE user_id = $1`,
      [req.user.id]
    );

    if (userCamin.rows.length === 0 || !userCamin.rows[0].camin_id) {
      return res.status(404).json({ message: "Nu e asociat niciun cămin." });
    }

    const caminId = userCamin.rows[0].camin_id;

    // 2️⃣ Căutăm administratorul acelui cămin
    const admin = await db.query(
      `SELECT u.nume, u.prenume, u.email
       FROM administratori a
       JOIN users u ON a.user_id = u.id
       WHERE a.camin_id = $1
       LIMIT 1`,
      [caminId]
    );

    if (admin.rows.length === 0) {
      return res.status(404).json({ message: "Nu s-a găsit administrator pentru acest cămin." });
    }

    res.json(admin.rows[0]);

  } catch (err) {
    console.error("Eroare la /contact-administratie:", err);
    res.status(500).json({ message: "Eroare la server." });
  }
});

app.delete("/notificari/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM notificari WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notificare nu a fost găsită." });
    }
    res.status(200).json({ message: "Notificare ștearsă." });
  } catch (err) {
    console.error("Eroare la ștergerea notificării:", err);
    res.status(500).json({ message: "Eroare de server." });
  }
});


app.get("/statistici/sesizari-pe-status", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT status, COUNT(*) AS valoare
      FROM sesizari
      GROUP BY status
      ORDER BY status
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la sesizari pe status:", err);
    res.status(500).json({ eroare: "Eroare la preluarea sesizărilor" });
  }
});

app.get("/statistici/evolutie-sesizari", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT TO_CHAR(data_trimitere, 'YYYY-MM') as luna, COUNT(*) as total
      FROM sesizari
      GROUP BY luna
      ORDER BY luna
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare evolutie sesizari:", err);
    res.status(500).json({ eroare: "Eroare la evoluție sesizări" });
  }
});

app.get("/statistici/rating-mediu", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        luna_recenzie AS luna,
        ROUND(AVG((
          curatenie + facilitati + zgomot + internet + personal_administrativ + securitate
        ) / 6.0), 2) AS media
      FROM recenzii_camine
      GROUP BY luna_recenzie
      ORDER BY luna_recenzie
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare rating mediu:", err);
    res.status(500).json({ eroare: "Eroare la preluarea ratingurilor" });
  }
});

app.get("/statistici/grad-ocupare", async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Găsește căminul administrat de utilizatorul logat
    const adminRes = await db.query(`
      SELECT camin_id FROM administratori WHERE user_id = $1
    `, [userId]);

    if (adminRes.rowCount === 0) {
      return res.status(404).json({ eroare: "Nu ești asociat cu niciun cămin." });
    }

    const caminId = adminRes.rows[0].camin_id;

    // 2. Obține capacitatea totală a căminului
    const caminRes = await db.query(`
      SELECT capacitate_total FROM camine WHERE id = $1
    `, [caminId]);

    const capacitateTotala = Number(caminRes.rows[0]?.capacitate_total);

    // 3. Numărăm locurile ocupate în camerele căminului
    const camereRes = await db.query(`
      SELECT student1, student2, student3, student4
      FROM camere
      WHERE camin_id = $1
    `, [caminId]);

    const ocupate = camereRes.rows.reduce((acc, cam) => {
      const locuri = [cam.student1, cam.student2, cam.student3, cam.student4];
      return acc + locuri.filter(s => s !== null).length;
    }, 0);

    res.json({ ocupate, total: capacitateTotala });
  } catch (err) {
    console.error("Eroare grad ocupare:", err);
    res.status(500).json({ eroare: "Eroare la calcul grad ocupare" });
  }
});

app.get("/statistici/locuri-ocupate-pe-etaj", async (req, res) => {
  try {
    const userId = req.user.id;

    const adminRes = await db.query(`
      SELECT camin_id FROM administratori WHERE user_id = $1
    `, [userId]);

    const caminId = adminRes.rows[0]?.camin_id;
    if (!caminId) return res.status(404).json({ eroare: "Nu ai un cămin atribuit." });

    const result = await db.query(`
      SELECT etaj,
        COUNT(student1) + COUNT(student2) + COUNT(student3) + COUNT(student4) AS ocupate
      FROM camere
      WHERE camin_id = $1
      GROUP BY etaj
      ORDER BY etaj
    `, [caminId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Eroare locuri ocupate pe etaj:", err);
    res.status(500).json({ eroare: "Eroare la calculul ocupării" });
  }
});

app.get("/statistici/timp-mediu-rezolvare", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        TO_CHAR(data_update, 'YYYY-MM') AS luna,
        ROUND(AVG(EXTRACT(EPOCH FROM (data_update - data_trimitere)) / 3600), 2) AS ore_medii
      FROM sesizari
      WHERE status != 'neprocesata' AND data_update IS NOT NULL
      GROUP BY luna
      ORDER BY luna
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la calcul timp mediu:", err);
    res.status(500).json({ eroare: "Eroare server." });
  }
});

app.get("/statistici/activitate-zilnica", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        data::date AS zi,
        COUNT(*) AS total
      FROM (
        SELECT data_trimitere AS data FROM sesizari
        UNION ALL
        SELECT data_creare FROM cerere_cazare
        UNION ALL
        SELECT TO_DATE(luna_recenzie, 'YYYY-MM') AS data FROM recenzii_camine
      ) actiuni
      GROUP BY zi
      ORDER BY zi;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Eroare activitate zilnică:", err);
    res.status(500).json({ eroare: "Eroare server." });
  }
});



app.listen(port, async () => {
  console.log(`App is running on http://localhost:${port}`);
});

export default db;
