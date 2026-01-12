import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido por Supabase
  },
});

/* =========================
   TEST DE CONEXIÓN
========================= */
pool.on("connect", () => {
  console.log("🟢 Conectado a Supabase PostgreSQL");
});

pool.on("error", (err) => {
  console.error("🔴 Error en PostgreSQL:", err);
});