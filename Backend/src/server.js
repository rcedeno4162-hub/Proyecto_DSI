import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   CORS – PRODUCCIÓN + LOCAL + VERCEL
   (configuración robusta)
===================================================== */
app.use(
  cors({
    origin: true, // ✅ permite cualquier origen (Vercel, localhost, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ⬇️ NECESARIO para preflight (CORS)
app.options("*", cors());

app.use(express.json());

/* =====================================================
   RUTA TEST
===================================================== */
app.get("/", (_, res) => {
  res.send("🚀 API funcionando correctamente");
});

/* =====================================================
   LOGIN
===================================================== */
app.post("/login", async (req, res) => {
  const { cedula, clave, rol } = req.body;

  if (!cedula || !clave || !rol) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    const r = await pool.query(
      "SELECT * FROM usuarios WHERE cedula=$1 AND rol=$2",
      [cedula, rol]
    );

    if (r.rowCount === 0) {
      return res.status(401).json({ mensaje: "Usuario o rol incorrecto" });
    }

    const usuario = r.rows[0];
    const valido = await bcrypt.compare(clave, usuario.clave);

    if (!valido) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    res.json({
      usuario: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

/* =====================================================
   REGISTRO DE USUARIOS
===================================================== */
app.post("/usuarios", async (req, res) => {
  const { cedula, nombre, clave, rol } = req.body;

  if (!cedula || !nombre || !clave || !rol) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE cedula=$1",
      [cedula]
    );

    if (existe.rowCount > 0) {
      return res.status(400).json({ mensaje: "La cédula ya está registrada" });
    }

    const hash = await bcrypt.hash(clave, 10);

    await pool.query(
      "INSERT INTO usuarios (cedula, nombre, clave, rol) VALUES ($1,$2,$3,$4)",
      [cedula, nombre, hash, rol]
    );

    res.json({ mensaje: "Usuario registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
});

/* =====================================================
   ESTUDIANTES
===================================================== */
app.get("/estudiantes", async (_, res) => {
  try {
    const r = await pool.query("SELECT * FROM estudiantes ORDER BY id");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post("/estudiantes", async (req, res) => {
  const { cedula, nombre } = req.body;

  if (!cedula || !nombre) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    const r = await pool.query(
      "INSERT INTO estudiantes (cedula, nombre) VALUES ($1,$2) RETURNING *",
      [cedula, nombre]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

/* =====================================================
   ASIGNATURAS
===================================================== */
app.get("/asignaturas", async (_, res) => {
  try {
    const r = await pool.query("SELECT * FROM asignaturas ORDER BY id");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

/* =====================================================
   CALIFICACIONES
===================================================== */
app.get("/calificaciones", async (_, res) => {
  try {
    const r = await pool.query(`
      SELECT 
        c.id,
        e.nombre AS estudiante,
        a.nombre AS asignatura,
        c.nota
      FROM calificaciones c
      JOIN estudiantes e ON e.id = c.estudiante_id
      JOIN asignaturas a ON a.id = c.asignatura_id
      ORDER BY c.id
    `);

    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

/* =====================================================
   SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`✅ Backend activo en puerto ${PORT}`);
});
