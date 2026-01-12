import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

/* =========================
   API
========================= */
const API = import.meta.env.VITE_API_URL;

const app = document.getElementById("app");

/* =========================
   ESTADO
========================= */
let usuario = null;

/* =========================
   INIT
========================= */
renderLogin();

/* =========================
   EVENT DELEGATION
========================= */
document.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  if (!action) return;

  if (action === "login") login();
  if (action === "go-registro") renderRegistro();
  if (action === "go-login") renderLogin();
  if (action === "registrar") registrar();
  if (action === "logout") salir();

  if (action === "estudiantes") cargarEstudiantes();
  if (action === "asignaturas") cargarAsignaturas();
  if (action === "calificaciones") cargarCalificaciones();
  if (action === "nota") vistaRegistrarNota();

  if (action === "add-est") crearEstudiante();
  if (action === "del-est") eliminarEst(id);

  if (action === "add-asig") crearAsignatura();
  if (action === "del-asig") eliminarAsig(id);

  if (action === "save-nota") guardarNota();
  if (action === "del-cal") eliminarCal(id);
});

/* =====================================================
   LOGIN
===================================================== */
function renderLogin() {
  app.innerHTML = `
  <div class="vh-100 d-flex justify-content-center align-items-center">
    <div class="card p-4 shadow login-card">
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
  </div>`;
}

async function login() {
  msg.classList.add("d-none");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: cedula.value,
        clave: clave.value,
        rol: rol.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje);

    usuario = data.usuario;
    renderDashboard();
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.remove("d-none");
  }
}

/* =====================================================
   REGISTRO
===================================================== */
function renderRegistro() {
  app.innerHTML = `
  <div class="vh-100 d-flex justify-content-center align-items-center">
    <div class="card p-4 shadow login-card">
      <h4 class="text-center mb-3">Registro</h4>

      <input id="rCedula" class="form-control mb-2" placeholder="Cédula">
      <input id="rNombre" class="form-control mb-2" placeholder="Nombre">
      <select id="rRol" class="form-select mb-2">
        <option value="admin">Docente</option>
        <option value="estudiante">Estudiante</option>
      </select>
      <input id="rClave" type="password" class="form-control mb-3" placeholder="Contraseña">

      <button class="btn btn-success w-100" data-action="registrar">Registrar</button>
      <div class="text-center mt-3">
        <a href="#" data-action="go-login">Volver</a>
      </div>
    </div>
  </div>`;
}

async function registrar() {
  await fetch(`${API}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cedula: rCedula.value,
      nombre: rNombre.value,
      rol: rRol.value,
      clave: rClave.value,
    }),
  });

  alert("Usuario registrado");
  renderLogin();
}

/* =====================================================
   DASHBOARD DOCENTE
===================================================== */
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
      <button data-action="calificaciones">📊 Calificaciones</button>
      <button data-action="estudiantes">👨‍🎓 Estudiantes</button>
      <button data-action="asignaturas">📚 Asignaturas</button>
      <button data-action="nota">✏️ Registrar Nota</button>
    </div>

    <div class="content">
      <div id="contenido"></div>
    </div>
  </div>`;

  cargarCalificaciones();
}

function salir() {
  usuario = null;
  renderLogin();
}

/* =====================================================
   ESTUDIANTES
===================================================== */
async function cargarEstudiantes() {
  const r = await fetch(`${API}/estudiantes`);
  const data = await r.json();

  contenido.innerHTML = `
    <h4>Estudiantes</h4>
    <input id="estCedula" class="form-control mb-2" placeholder="Cédula">
    <input id="estNombre" class="form-control mb-2" placeholder="Nombre">
    <button class="btn btn-success mb-3" data-action="add-est">Agregar</button>

    <ul class="list-group">
      ${data
        .map(
          (e) => `
        <li class="list-group-item d-flex justify-content-between">
          ${e.nombre} (${e.cedula})
          <button class="btn btn-sm btn-danger" data-action="del-est" data-id="${e.id}">X</button>
        </li>`
        )
        .join("")}
    </ul>`;
}

async function crearEstudiante() {
  await fetch(`${API}/estudiantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cedula: estCedula.value,
      nombre: estNombre.value,
    }),
  });
  cargarEstudiantes();
}

async function eliminarEst(id) {
  await fetch(`${API}/estudiantes/${id}`, { method: "DELETE" });
  cargarEstudiantes();
}

/* =====================================================
   ASIGNATURAS
===================================================== */
async function cargarAsignaturas() {
  const r = await fetch(`${API}/asignaturas`);
  const data = await r.json();

  contenido.innerHTML = `
    <h4>Asignaturas</h4>
    <input id="asigNombre" class="form-control mb-2" placeholder="Nombre">
    <input id="asigCreditos" class="form-control mb-2" type="number" placeholder="Créditos">
    <button class="btn btn-success mb-3" data-action="add-asig">Agregar</button>

    <ul class="list-group">
      ${data
        .map(
          (a) => `
        <li class="list-group-item d-flex justify-content-between">
          ${a.nombre} (${a.creditos})
          <button class="btn btn-sm btn-danger" data-action="del-asig" data-id="${a.id}">X</button>
        </li>`
        )
        .join("")}
    </ul>`;
}

async function crearAsignatura() {
  await fetch(`${API}/asignaturas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: asigNombre.value,
      creditos: asigCreditos.value,
    }),
  });
  cargarAsignaturas();
}

async function eliminarAsig(id) {
  await fetch(`${API}/asignaturas/${id}`, { method: "DELETE" });
  cargarAsignaturas();
}

/* =====================================================
   REGISTRAR NOTA
===================================================== */
async function vistaRegistrarNota() {
  const est = await (await fetch(`${API}/estudiantes`)).json();
  const asig = await (await fetch(`${API}/asignaturas`)).json();

  contenido.innerHTML = `
    <h4>Registrar Nota</h4>

    <select id="notaEst" class="form-select mb-2">
      ${est.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join("")}
    </select>

    <select id="notaAsig" class="form-select mb-2">
      ${asig.map((a) => `<option value="${a.id}">${a.nombre}</option>`).join("")}
    </select>

    <input id="notaValor" type="number" class="form-control mb-2" placeholder="Nota">

    <button class="btn btn-primary" data-action="save-nota">Guardar</button>`;
}

async function guardarNota() {
  await fetch(`${API}/calificaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estudiante_id: notaEst.value,
      asignatura_id: notaAsig.value,
      nota: notaValor.value,
    }),
  });

  cargarCalificaciones();
}

/* =====================================================
   CALIFICACIONES
===================================================== */
async function cargarCalificaciones() {
  const r = await fetch(`${API}/calificaciones`);
  const data = await r.json();

  contenido.innerHTML = `
    <h4>Calificaciones</h4>
    <ul class="list-group">
      ${data
        .map(
          (c) => `
        <li class="list-group-item d-flex justify-content-between">
          ${c.estudiante} - ${c.asignatura} = <b>${c.nota}</b>
          <button class="btn btn-sm btn-danger" data-action="del-cal" data-id="${c.id}">X</button>
        </li>`
        )
        .join("")}
    </ul>`;
}

async function eliminarCal(id) {
  await fetch(`${API}/calificaciones/${id}`, { method: "DELETE" });
  cargarCalificaciones();
}
