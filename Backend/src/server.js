import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   CORS (LOCAL + VERCEL)
===================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite llamadas sin origin (Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("No permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

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

  try {
    if (!cedula || !clave || !rol) {
      return res.status(400).json({ mensaje: "Datos incompletos" });
    }

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
    res.status(500).json({ mensaje: err.message });
  }
});

/* =====================================================
   REGISTRO DE USUARIOS
===================================================== */
app.post("/usuarios", async (req, res) => {
  const { cedula, nombre, clave, rol } = req.body;

  try {
    if (!cedula || !nombre || !clave || !rol) {
      return res.status(400).json({ mensaje: "Datos incompletos" });
    }

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
    res.status(500).json({ mensaje: err.message });
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

app.put("/estudiantes/:id", async (req, res) => {
  const { id } = req.params;
  const { cedula, nombre } = req.body;

  try {
    await pool.query(
      "UPDATE estudiantes SET cedula=$1, nombre=$2 WHERE id=$3",
      [cedula, nombre, id]
    );
    res.json({ mensaje: "Estudiante actualizado" });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.delete("/estudiantes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM calificaciones WHERE estudiante_id=$1",
      [id]
    );
    await pool.query("DELETE FROM estudiantes WHERE id=$1", [id]);
    res.json({ mensaje: "Estudiante eliminado" });
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

app.post("/asignaturas", async (req, res) => {
  const { nombre, creditos } = req.body;

  if (!nombre || creditos === undefined) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    const r = await pool.query(
      "INSERT INTO asignaturas (nombre, creditos) VALUES ($1,$2) RETURNING *",
      [nombre, creditos]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.delete("/asignaturas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM calificaciones WHERE asignatura_id=$1",
      [id]
    );
    await pool.query("DELETE FROM asignaturas WHERE id=$1", [id]);
    res.json({ mensaje: "Asignatura eliminada" });
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

app.post("/calificaciones", async (req, res) => {
  const { estudiante_id, asignatura_id, nota } = req.body;

  if (!estudiante_id || !asignatura_id || nota === undefined) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    await pool.query(
      "INSERT INTO calificaciones (estudiante_id, asignatura_id, nota) VALUES ($1,$2,$3)",
      [estudiante_id, asignatura_id, nota]
    );
    res.json({ mensaje: "Nota registrada correctamente" });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.delete("/calificaciones/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM calificaciones WHERE id=$1", [id]);
    res.json({ mensaje: "Nota eliminada" });
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
