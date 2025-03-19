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
import path from "path"
import ngrok from "ngrok";
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"

dotenv.config();

const app = express();
const port = process.env.PORT;

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folderul unde se salvează imaginile
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}${ext}`); // Salvez poza cu ID-ul utilizatorului
  }
});

const upload = multer({ storage });

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET, 
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
    if (!user) return res.status(401).json({ message: info.message });

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
         AND (u.nume ILIKE $3 OR u.prenume ILIKE $3)
       ORDER BY u.nume ASC, u.prenume ASC`,
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
      grupa: studentData.grupa || null
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

app.post("/upload-profile-pic", upload.single("pozaProfil"), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Neautorizat" });
  }

  const { telefon } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // 👈 Verifică dacă există fișier

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


app.use("/uploads", express.static("uploads"));

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
      `SELECT u.nume, u.prenume, c.optiune1_camera, c.optiune2_camera, c.optiune3_camera, c.colegi
       FROM cerere_cazare c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [cerereId]
    );

    if (cerereResult.rows.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    const cerere = cerereResult.rows[0];
    const studentPrincipal = `${cerere.nume} ${cerere.prenume}`;
    const userIdPrincipal = req.user.id;

    // Aleg numărul camerei din opțiunea selectată
    const numarCamera =
      optiune === "1" ? cerere.optiune1_camera :
      optiune === "2" ? cerere.optiune2_camera :
      optiune === "3" ? cerere.optiune3_camera :
      null;

    if (!numarCamera) {
      return res.status(400).json({ message: "Opțiunea selectată nu conține o cameră validă." });
    }
    

    // Găsesc camera și numărul actual de paturi disponibile
    const cameraResult = await db.query(
      `SELECT id, camin_id, numar_paturi, student1, student2, student3, student4 FROM camere WHERE id = $1`,
      [parseInt(numarCamera, 10)]
    );

    if (cameraResult.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }

    const camera = cameraResult.rows[0];
    const cameraId = camera.id;
    const caminId = camera.camin_id;
    let { numar_paturi, student1, student2, student3, student4 } = camera;

    // Obțin numele colegilor
    let colegiIds = [];
    let colegiNume = [];
    if (cerere.colegi) {
      colegiIds = cerere.colegi.split(",").map(id => parseInt(id.trim()));

      if (colegiIds.length > 0) {
        const colegiResult = await db.query(
          `SELECT CONCAT(nume, ' ', prenume) AS nume_complet FROM users WHERE id = ANY($1)`,
          [colegiIds]
        );
        colegiNume = colegiResult.rows.map(row => row.nume_complet);
      }
    }

    const numarStudenti = colegiNume.length + 1; // Studentul principal + colegii
    const locuriDisponibile = numar_paturi; // Folosim numărul actual de paturi înainte de update

    const cameraActualizata = await db.query(
      `SELECT numar_paturi, student1, student2, student3, student4 FROM camere WHERE id = $1`,
      [cameraId]
    );
    
    if (cameraActualizata.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }
    
    const cameraInfo = cameraActualizata.rows[0];
    const locuriOcupate = [cameraInfo.student1, cameraInfo.student2, cameraInfo.student3, cameraInfo.student4].filter(s => s !== null).length;
    const locuriRamase = cameraInfo.numar_paturi - locuriOcupate;
    
    if (numarStudenti > locuriRamase) {
      return res.status(400).json({ message: "Camera nu are suficiente locuri disponibile! Validarea a fost anulată." });
    }

    // Scad numărul de paturi abia acum, după ce am verificat disponibilitatea
    const numarPaturiNou = Math.max(numar_paturi - numarStudenti, 0);

    // Adaug studenții în ordine
    const studentiNoi = [studentPrincipal, ...colegiNume];

    if (!student1) student1 = studentiNoi.shift();
    if (!student2 && studentiNoi.length > 0) student2 = studentiNoi.shift();
    if (!student3 && studentiNoi.length > 0) student3 = studentiNoi.shift();
    if (!student4 && studentiNoi.length > 0) student4 = studentiNoi.shift();

    // Setez camera ca indisponibilă dacă nu mai sunt locuri
    const esteDisponibila = numarPaturiNou > 0;

    // Actualizez baza de date: studenți și număr de paturi disponibile
    await db.query(
      `UPDATE camere 
       SET student1 = $1, student2 = $2, student3 = $3, student4 = $4, este_disponibila = $5, numar_paturi = $6
       WHERE id = $7`,
      [student1, student2, student3, student4, esteDisponibila, numarPaturiNou, cameraId]
    );

    // 🔹 Actualizează și tabela `studenti` pentru fiecare student cazat
    for (const studentId of [userIdPrincipal, ...colegiIds]) {
      await db.query(
        `UPDATE studenti 
         SET camin_id = $1, camera_id = $2 
         WHERE user_id = $3`,
        [caminId, cameraId, studentId]
      );
    }

    // Șterg cererea după validare
    await db.query(
      `DELETE FROM cerere_cazare 
       WHERE user_id = $1 OR string_to_array(colegi, ',')::int[] && $2`,
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
    res.json({ message: "Anunț șters cu succes" });
  } catch (error) {
    console.error("Eroare la ștergerea anunțului:", error);
    res.status(500).json({ error: "Eroare server" });
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
                  s.facultate, s.specializare, s.grupa, s.telefon, s.camera_id
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


app.listen(port, async () => {
  console.log(`App is running on http://localhost:${port}`);
});