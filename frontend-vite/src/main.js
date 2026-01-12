import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

/* =========================
   API
========================= */
const API = import.meta.env.VITE_API_URL;
const app = document.getElementById("app");

/* =========================
   ESTADO GLOBAL
========================= */
let usuario = null;

/* =========================
   INICIO
========================= */
renderLogin();

/* =========================
   EVENTOS GLOBALES
========================= */
document.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  const id = e.target.dataset.id;

  const actions = {
    login,
    salir,
    "go-registro": renderRegistro,
    "go-login": renderLogin,
    estudiantes: renderEstudiantes,
    asignaturas: renderAsignaturas,
    nota: renderRegistrarNota,
    calificaciones: renderCalificaciones,
    "add-est": crearEstudiante,
    "del-est": () => eliminarEstudiante(id),
    "add-asig": crearAsignatura,
    "del-asig": () => eliminarAsignatura(id),
  };

  actions[action]?.();
});

/* =========================
   LOGIN
========================= */
function renderLogin() {
  app.innerHTML = `
  <div class="vh-100 d-flex justify-content-center align-items-center bg-light">
    <div class="card shadow p-4" style="width:420px">
      <h3 class="text-center mb-3">Sistema Académico</h3>

      <input id="cedula" class="form-control mb-2" placeholder="Cédula">
      <select id="rol" class="form-select mb-2">
        <option value="">Seleccione rol</option>
        <option value="admin">Docente</option>
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
    msg.textContent = err.message || "Error de conexión";
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
      <input id="rClave" type="password" class="form-control mb-3" placeholder="Contraseña">

      <button class="btn btn-success w-100" onclick="registrar()">Registrar</button>

      <div class="text-center mt-3">
        <a href="#" data-action="go-login">Volver</a>
      </div>
    </div>
  </div>`;
}

window.registrar = async () => {
  await fetch(`${API}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cedula: rCedula.value,
      nombre: rNombre.value,
      rol: "admin",
      clave: rClave.value,
    }),
  });

  alert("Usuario registrado correctamente");
  renderLogin();
};

/* =========================
   DASHBOARD (DOCENTE)
========================= */
function renderDashboard() {
  app.innerHTML = `
<nav class="navbar navbar-dark bg-dark px-4">
  <span class="navbar-brand">Sistema Académico</span>
  <div>
    <span class="text-white me-3">${usuario.nombre} (Docente)</span>
    <button class="btn btn-danger btn-sm" data-action="salir">Salir</button>
  </div>
</nav>

<div class="d-flex">
  <div class="sidebar">
    <button data-action="estudiantes">👨‍🎓 Estudiantes</button>
    <button data-action="asignaturas">📚 Asignaturas</button>
    <button data-action="nota">📝 Registrar Nota</button>
    <button data-action="calificaciones">📊 Calificaciones</button>
  </div>

  <div class="flex-fill p-4">
    <div id="contenido"></div>
  </div>
</div>`;

  renderBienvenida();
}

function renderBienvenida() {
  contenido.innerHTML = `
  <div class="card p-4 shadow-sm">
    <h3>Bienvenido al sistema</h3>
    <p class="text-muted">Seleccione una opción del menú</p>
  </div>`;
}

function salir() {
  usuario = null;
  renderLogin();
}

/* =========================
   ESTUDIANTES
========================= */
async function renderEstudiantes() {
  const data = await fetch(`${API}/estudiantes`).then((r) => r.json());

  contenido.innerHTML = `
<div class="card p-4 shadow-sm">
  <h4 class="mb-3">Estudiantes</h4>

  <div class="row g-2 mb-3">
    <div class="col">
      <input id="eCedula" class="form-control" placeholder="Cédula">
    </div>
    <div class="col">
      <input id="eNombre" class="form-control" placeholder="Nombre">
    </div>
    <div class="col-2">
      <button class="btn btn-success w-100" data-action="add-est">Agregar</button>
    </div>
  </div>

  <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th>Cédula</th>
        <th>Nombre</th>
        <th width="80">Acción</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(e => `
        <tr>
          <td>${e.cedula}</td>
          <td>${e.nombre}</td>
          <td class="text-center">
            <button class="btn btn-danger btn-sm" data-action="del-est" data-id="${e.id}">X</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>`;
}

async function crearEstudiante() {
  await fetch(`${API}/estudiantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cedula: eCedula.value,
      nombre: eNombre.value,
    }),
  });
  renderEstudiantes();
}

async function eliminarEstudiante(id) {
  await fetch(`${API}/estudiantes/${id}`, { method: "DELETE" });
  renderEstudiantes();
}

/* =========================
   ASIGNATURAS
========================= */
async function renderAsignaturas() {
  const data = await fetch(`${API}/asignaturas`).then(r => r.json());

  contenido.innerHTML = `
<div class="card p-4 shadow-sm">
  <h4 class="mb-3">Asignaturas</h4>

  <div class="row g-2 mb-3">
    <div class="col">
      <input id="aNombre" class="form-control" placeholder="Nombre">
    </div>
    <div class="col">
      <input id="aCreditos" type="number" class="form-control" placeholder="Créditos">
    </div>
    <div class="col-2">
      <button class="btn btn-success w-100" data-action="add-asig">Agregar</button>
    </div>
  </div>

  <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th>Nombre</th>
        <th>Créditos</th>
        <th width="80">Acción</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(a => `
        <tr>
          <td>${a.nombre}</td>
          <td>${a.creditos}</td>
          <td class="text-center">
            <button class="btn btn-danger btn-sm" data-action="del-asig" data-id="${a.id}">X</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>`;
}

async function crearAsignatura() {
  await fetch(`${API}/asignaturas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: aNombre.value,
      creditos: aCreditos.value,
    }),
  });
  renderAsignaturas();
}

async function eliminarAsignatura(id) {
  await fetch(`${API}/asignaturas/${id}`, { method: "DELETE" });
  renderAsignaturas();
}

/* =========================
   REGISTRAR NOTA
========================= */
async function renderRegistrarNota() {
  const est = await fetch(`${API}/estudiantes`).then(r => r.json());
  const asig = await fetch(`${API}/asignaturas`).then(r => r.json());

  contenido.innerHTML = `
<div class="card p-4 shadow-sm">
  <h4>Registrar Nota</h4>

  <select id="nEst" class="form-select mb-2">
    ${est.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("")}
  </select>

  <select id="nAsig" class="form-select mb-2">
    ${asig.map(a => `<option value="${a.id}">${a.nombre}</option>`).join("")}
  </select>

  <input id="nNota" type="number" class="form-control mb-3" placeholder="Nota">

  <button class="btn btn-primary" onclick="guardarNota()">Guardar</button>
</div>`;
}

window.guardarNota = async () => {
  await fetch(`${API}/calificaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estudiante_id: nEst.value,
      asignatura_id: nAsig.value,
      nota: nNota.value,
    }),
  });
  alert("Nota registrada");
};

/* =========================
   CALIFICACIONES
========================= */
async function renderCalificaciones() {
  const data = await fetch(`${API}/calificaciones`).then(r => r.json());

  contenido.innerHTML = `
<div class="card p-4 shadow-sm">
  <h4>Calificaciones</h4>

  <table class="table table-striped">
    <thead>
      <tr>
        <th>Estudiante</th>
        <th>Asignatura</th>
        <th>Nota</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(c => `
        <tr>
          <td>${c.estudiante}</td>
          <td>${c.asignatura}</td>
          <td>${c.nota}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>`;
}
