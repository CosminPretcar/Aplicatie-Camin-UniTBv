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

app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ 
      isAuthenticated: true, 
      nume: req.user.nume, 
      prenume: req.user.prenume, 
      email: req.user.email, 
      facultate: req.user.facultate, 
      specializare: req.user.specializare, 
      poza_profil: req.user.poza_profil,
      esteAdmin: req.user.administrator
    });
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
      "SELECT id, nume, prenume, facultate, specializare FROM users WHERE id != $1 AND sex = $2 AND (nume ILIKE $3 OR prenume ILIKE $3)",
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

  console.log("🔹 Cerere primită pe server:", req.body);

  try {
    const { cereri, colegi } = req.body;

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
      `INSERT INTO cerere_cazare (user_id, colegi, optiune1_camin, optiune1_camera, optiune2_camin, optiune2_camera, optiune3_camin, optiune3_camera) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.id,
        colegi.join(","), // Transform array-ul colegilor în string
        optiune1.caminId, optiune1.cameraId,
        optiune2.caminId, optiune2.cameraId,
        optiune3.caminId, optiune3.cameraId
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
    const result = await db.query(
      "SELECT id, nume, prenume, email, facultate, specializare, poza_profil, administrator FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return cb(null, false);
    }

    cb(null, result.rows[0]);
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

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    await db.query("UPDATE users SET poza_profil = $1 WHERE id = $2", [imageUrl, req.user.id]);
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
      `SELECT c.id, u.nume, u.prenume, c.data_creare, 
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
      `SELECT etaj, numar_camera, este_disponibila FROM camere WHERE camin_id = $1 ORDER BY etaj, numar_camera`,
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
    // Obținem numele studentului și colegii săi
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

    // Aleg numărul camerei din opțiunea selectată
    const numarCamera =
      optiune === "1" ? cerere.optiune1_camera :
      optiune === "2" ? cerere.optiune2_camera :
      optiune === "3" ? cerere.optiune3_camera :
      null;

    if (!numarCamera) {
      return res.status(400).json({ message: "Opțiunea selectată nu conține o cameră validă." });
    }

    // Găsesc ID-ul camerei pe baza numărului camerei
    console.log("🔎 Căutăm camera cu număr:", numarCamera);

    const cameraIdResult = await db.query(
      `SELECT id, student1, student2, student3, student4 FROM camere WHERE id = $1`,
      [parseInt(numarCamera, 10)]
    );
    

    if (cameraIdResult.rows.length === 0) {
      return res.status(404).json({ message: "Camera nu a fost găsită." });
    }

    const camera = cameraIdResult.rows[0];
    const cameraId = camera.id;
    let { student1, student2, student3, student4 } = camera;

    //Obțin numele colegilor
    let colegiNume = [];
    if (cerere.colegi) {
      const colegiIds = cerere.colegi.split(",").map(id => parseInt(id.trim()));
      if (colegiIds.length > 0) {
        const colegiResult = await db.query(
          `SELECT CONCAT(nume, ' ', prenume) AS nume_complet FROM users WHERE id = ANY($1)`,
          [colegiIds]
        );
        colegiNume = colegiResult.rows.map(row => row.nume_complet);
      }
    }

    //Verific locurile disponibile
    const studentiOcupati = [student1, student2, student3, student4].filter(s => s !== null).length;
    const locuriDisponibile = 4 - studentiOcupati;

    if (colegiNume.length + 1 > locuriDisponibile) {
      return res.status(400).json({ message: "Camera nu are suficiente locuri disponibile." });
    }

    
    const studentiNoi = [studentPrincipal, ...colegiNume];

    if (!student1) student1 = studentiNoi.shift();
    if (!student2 && studentiNoi.length > 0) student2 = studentiNoi.shift();
    if (!student3 && studentiNoi.length > 0) student3 = studentiNoi.shift();
    if (!student4 && studentiNoi.length > 0) student4 = studentiNoi.shift();

    //Setez camera ca indisponibilă dacă este complet ocupată
    const esteDisponibila = !(student1 && student2 && student3 && student4);

    await db.query(
      `UPDATE camere 
       SET student1 = $1, student2 = $2, student3 = $3, student4 = $4, este_disponibila = $5
       WHERE id = $6`,
      [student1, student2, student3, student4, esteDisponibila, cameraId]
    );

    //Șterg cererea după validare
    await db.query("DELETE FROM cerere_cazare WHERE id = $1", [cerereId]);

    res.json({ message: "Cererea a fost validată cu succes!" });

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





app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});