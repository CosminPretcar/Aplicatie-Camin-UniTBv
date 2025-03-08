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
    cb(null, `profile-${req.user.id}${ext}`); // Salvăm poza cu ID-ul utilizatorului
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

    // Verificăm dacă există cereri valide
    if (!cereri || cereri.length === 0) {
      return res.status(400).json({ message: "Trebuie să selectați cel puțin o cameră!" });
    }

    // Extragem valorile pentru fiecare opțiune
    const optiune1 = cereri[0] || { caminId: null, cameraId: null };
    const optiune2 = cereri[1] || { caminId: null, cameraId: null };
    const optiune3 = cereri[2] || { caminId: null, cameraId: null };

    // Inserăm cererea în baza de date
    await db.query(
      `INSERT INTO cerere_cazare (user_id, colegi, optiune1_camin, optiune1_camera, optiune2_camin, optiune2_camera, optiune3_camin, optiune3_camera) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.id,
        colegi.join(","), // Transformăm array-ul colegilor în string
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

    console.log("🟢 Utilizator deserializat:", result.rows[0]); // Debugging
    

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

// Servim fișierele statice din folderul uploads
app.use("/uploads", express.static("uploads"));

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});