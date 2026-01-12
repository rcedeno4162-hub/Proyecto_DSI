import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

/* =========================
   API
========================= */
const API = import.meta.env.VITE_API_URL;

if (!API) {
  alert("VITE_API_URL no está definida");
}

/* =========================
   APP
========================= */
const app = document.getElementById("app");

/* =========================
   ESTADO
========================= */
let usuario = null;
renderLogin();

/* =========================
   EVENT DELEGATION
========================= */
document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  switch (action) {
    case "login":
      await login();
      break;

    case "go-registro":
      renderRegistro();
      break;

    case "go-login":
      renderLogin();
      break;

    case "logout":
      usuario = null;
      renderLogin();
      break;
  }
});

/* =========================
   LOGIN
========================= */
function renderLogin() {
  app.innerHTML = `
    <div class="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div class="card p-4 shadow" style="width:420px">
        <h3 class="text-center mb-3">Sistema Académico</h3>

        <input id="cedula" class="form-control mb-2" placeholder="Cédula">
        <select id="rol" class="form-select mb-2">
          <option value="">Seleccione rol</option>
          <option value="admin">Docente</option>
          <option value="estudiante">Estudiante</option>
        </select>
        <input id="clave" type="password" class="form-control mb-3" placeholder="Contraseña">

        <button class="btn btn-primary w-100" data-action="login">Ingresar</button>

        <div class="text-center mt-3">
          <a href="#" data-action="go-registro">Registrarse</a>
        </div>

        <div id="msg" class="alert alert-danger mt-3 d-none"></div>
      </div>
    </div>
  `;
}

/* =========================
   LOGIN LOGIC
========================= */
async function login() {
  const cedula = document.getElementById("cedula").value;
  const rol = document.getElementById("rol").value;
  const clave = document.getElementById("clave").value;
  const msg = document.getElementById("msg");

  msg.classList.add("d-none");

  if (!cedula || !rol || !clave) {
    msg.textContent = "Complete todos los campos";
    msg.classList.remove("d-none");
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula, rol, clave })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.mensaje || "Error de login";
      msg.classList.remove("d-none");
      return;
    }

    usuario = data.usuario;
    renderDashboard();
  } catch (error) {
    msg.textContent = "No se pudo conectar con el servidor";
    msg.classList.remove("d-none");
  }
}

/* =========================
   REGISTRO
========================= */
function renderRegistro() {
  app.innerHTML = `
    <div class="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div class="card p-4 shadow" style="width:420px">
        <h4 class="text-center mb-3">Registro</h4>

        <input id="rCedula" class="form-control mb-2" placeholder="Cédula">
        <input id="rNombre" class="form-control mb-2" placeholder="Nombre">
        <select id="rRol" class="form-select mb-2">
          <option value="estudiante">Estudiante</option>
          <option value="admin">Docente</option>
        </select>
        <input id="rClave" type="password" class="form-control mb-3" placeholder="Contraseña">

        <button class="btn btn-success w-100" id="btnRegistrar">Registrar</button>

        <div class="text-center mt-3">
          <a href="#" data-action="go-login">Volver</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btnRegistrar").addEventListener("click", registrar);
}

/* =========================
   REGISTRAR USUARIO
========================= */
async function registrar() {
  const cedula = document.getElementById("rCedula").value;
  const nombre = document.getElementById("rNombre").value;
  const rol = document.getElementById("rRol").value;
  const clave = document.getElementById("rClave").value;

  if (!cedula || !nombre || !rol || !clave) {
    alert("Complete todos los campos");
    return;
  }

  try {
    const res = await fetch(`${API}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula, nombre, rol, clave })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.mensaje);
      return;
    }

    alert("Usuario registrado correctamente");
    renderLogin();
  } catch (error) {
    alert("No se pudo conectar con el servidor");
  }
}

/* =========================
   DASHBOARD (BASE)
========================= */
function renderDashboard() {
  app.innerHTML = `
    <nav class="navbar navbar-dark bg-dark px-4">
      <span class="navbar-brand">Sistema Académico</span>
      <div>
        <span class="text-white">${usuario.nombre} (${usuario.rol})</span>
        <button class="btn btn-danger btn-sm ms-3" data-action="logout">Salir</button>
      </div>
    </nav>

    <div class="d-flex">
      <div class="sidebar">
        <button>📊 Calificaciones</button>
      </div>

      <div class="flex-fill p-4">
        <div id="contenido">
          <h3>Bienvenido al sistema</h3>
        </div>
      </div>
    </div>
  `;
}
