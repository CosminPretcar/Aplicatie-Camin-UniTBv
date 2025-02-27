import express from "express";
import pg from "pg";
import cors from "cors"
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

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
      // secure: false, 
      // httpOnly: true, 
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

app.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, async (err) => {
      if (err) return next(err);

      try {
        const userResult = await db.query("SELECT email FROM users WHERE id = $1", [user.id]);
        const userEmail = userResult.rows[0].email;

        const mailOptions = {
          from: `"Sistem Cazare" <noreply@cazare.ro>`,
          to: userEmail,
          subject: "Autentificare reușită",
          text: `Salut, ${user.nume} ${user.prenume}!\n\nTe-ai autentificat cu succes în platforma de cazare.\n\nDacă nu ai fost tu, te rugăm să schimbi parola imediat!`
        };

        // Trimitem email-ul
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Eroare la trimiterea emailului:", error);
          } else {
            console.log("Email de autentificare trimis:", info.response);
          }
        });

      } catch (error) {
        console.log("Eroare la extragerea emailului:", error);
      }

      return res.json({ 
        message: "Login successful", 
        nume: user.nume, 
        prenume: user.prenume, 
        esteAdmin: user.esteAdmin
      });
    });
  })(req, res, next);
});

app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ isAuthenticated: true, nume: req.user.nume, prenume: req.user.prenume });
  } else {
    return res.json({ isAuthenticated: false });
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

  console.log("Cerere primită pe server:", req.body);

  try {
      const { caminId, etaj, cameraId, colegi } = req.body;
      const userId = req.user.id;

      if (!cameraId || !etaj || !caminId) {
          return res.status(400).json({ message: "Caminul, etajul și camera sunt necesare!" });
      }

      const cameraResult = await db.query(
          "SELECT numar_paturi, numar_camera FROM camere WHERE id = $1 AND camin_id = $2",
          [cameraId, caminId]
      );

      if (cameraResult.rows.length === 0) {
          return res.status(400).json({ message: "Camera selectată nu există în acest cămin!" });
      }

      const numarCamera = cameraResult.rows[0].numar_camera;
      const numarPaturi = cameraResult.rows[0].numar_paturi;
      const numarSolicitanti = colegi.length + 1; // +1 pentru utilizatorul curent

      if (numarSolicitanti > numarPaturi) {
          return res.status(400).json({ message: `Numărul maxim de persoane pentru această cameră este ${numarPaturi}.` });
      }

      const colegiString = colegi.join(",");

      await db.query(
          "INSERT INTO cereri_cazare (user_id, camin_id, etaj, camera_id, colegi) VALUES ($1, $2, $3, $4, $5)",
          [userId, caminId, etaj, cameraId, colegiString]
      );

      const userResult = await db.query("SELECT email, nume, prenume FROM users WHERE id = $1", [userId]);
      const userEmail = userResult.rows[0].email;
      const userNume = userResult.rows[0].nume;
      const userPrenume = userResult.rows[0].prenume;

      // 🔹 Trimitem email-ul de confirmare
      const mailOptions = {
        from: `"Cazare Campus" <noreply@cazare.ro>`, 
        to: userEmail, 
        subject: "Confirmare Cerere de Cazare",
        text: `Salut, ${userPrenume} ${userNume}! Cererea ta de cazare în căminul ${caminId}, etajul ${etaj}, camera ${numarCamera} a fost înregistrată.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Eroare la trimiterea emailului:", error);
        } else {
            console.log("Email trimis:", info.response);
        }
      });

      res.json({ message: "Cererea a fost înregistrată cu succes!" });
  } catch (error) {
      console.error("Error inserting cerere:", error);
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
    const result = await db.query("SELECT id, nume, prenume, esteadmin FROM users WHERE id = $1", [id]);
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

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});