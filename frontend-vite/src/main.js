import "./style.css";

const API = import.meta.env.VITE_API_URL;
const app = document.getElementById("app");

/* ===============================
   ESTADO GLOBAL
=============================== */
let usuario = JSON.parse(localStorage.getItem("usuario")) || null;

/* ===============================
   INIT
=============================== */
if (!usuario) {
  renderLogin();
} else {
  renderDashboard();
}

/* ===============================
   LOGIN
=============================== */
function renderLogin() {
  app.innerHTML = `
    <div class="login-container">
      <h2>Sistema Académico</h2>

      <input id="cedula" placeholder="Cédula" />
      <select id="rol">
        <option value="">Seleccione rol</option>
        <option value="docente">Docente</option>
        <option value="admin">Admin</option>
      </select>
      <input id="clave" type="password" placeholder="Contraseña" />

      <button onclick="login()">Ingresar</button>
      <p id="msg" class="error"></p>
    </div>
  `;
}

window.login = async () => {
  const cedula = document.getElementById("cedula").value;
  const rol = document.getElementById("rol").value;
  const clave = document.getElementById("clave").value;

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula, rol, clave }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje);

    usuario = data.usuario;
    localStorage.setItem("usuario", JSON.stringify(usuario));
    renderDashboard();
  } catch (err) {
    document.getElementById("msg").innerText = err.message;
  }
};

/* ===============================
   DASHBOARD
=============================== */
function renderDashboard() {
  app.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <h2>Sistema</h2>
        ${menuDocente()}
        <button onclick="logout()">Salir</button>
      </aside>

      <main class="main">
        <div id="contenido"></div>
      </main>
    </div>
  `;

  renderBienvenida();
}

window.logout = () => {
  localStorage.clear();
  location.reload();
};

/* ===============================
   MENÚ DOCENTE (AQUÍ ESTABA EL ERROR)
=============================== */
function menuDocente() {
  if (usuario.rol !== "docente" && usuario.rol !== "admin") return "";

  return `
    <button onclick="renderEstudiantes()">👨‍🎓 Estudiantes</button>
    <button onclick="renderAsignaturas()">📚 Asignaturas</button>
    <button onclick="renderCalificaciones()">📝 Registrar Nota</button>
  `;
}

/* ===============================
   BIENVENIDA
=============================== */
function renderBienvenida() {
  document.getElementById("contenido").innerHTML = `
    <div class="card">
      <h3>Bienvenido al sistema</h3>
      <p>Rol: <b>${usuario.rol}</b></p>
    </div>
  `;
}

/* ===============================
   ESTUDIANTES
=============================== */
window.renderEstudiantes = async () => {
  const r = await fetch(`${API}/estudiantes`);
  const data = await r.json();

  const cont = document.getElementById("contenido");

  cont.innerHTML = `
    <div class="card">
      <h3>Estudiantes</h3>

      <div class="form">
        <input id="cedula" placeholder="Cédula" />
        <input id="nombre" placeholder="Nombre" />
        <button onclick="agregarEstudiante()">Agregar</button>
      </div>

      <div class="list" id="lista"></div>
    </div>
  `;

  pintarLista(data);
};

function pintarLista(data) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(e => {
    lista.innerHTML += `
      <div class="list-item">
        <span>${e.nombre} (${e.cedula})</span>
        <button class="btn-delete" onclick="eliminarEstudiante(${e.id})">
          Eliminar
        </button>
      </div>
    `;
  });
}

window.agregarEstudiante = async () => {
  const cedula = document.getElementById("cedula").value;
  const nombre = document.getElementById("nombre").value;

  await fetch(`${API}/estudiantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cedula, nombre }),
  });

  renderEstudiantes();
};

window.eliminarEstudiante = async id => {
  await fetch(`${API}/estudiantes/${id}`, { method: "DELETE" });
  renderEstudiantes();
};

/* ===============================
   ASIGNATURAS
=============================== */
window.renderAsignaturas = async () => {
  const r = await fetch(`${API}/asignaturas`);
  const data = await r.json();

  document.getElementById("contenido").innerHTML = `
    <div class="card">
      <h3>Asignaturas</h3>
      <div class="list">
        ${data
          .map(a => `<div class="list-item">${a.nombre}</div>`)
          .join("")}
      </div>
    </div>
  `;
};

/* ===============================
   CALIFICACIONES
=============================== */
window.renderCalificaciones = async () => {
  const r = await fetch(`${API}/calificaciones`);
  const data = await r.json();

  document.getElementById("contenido").innerHTML = `
    <div class="card">
      <h3>Calificaciones</h3>
      <div class="list">
        ${data
          .map(
            c =>
              `<div class="list-item">
                ${c.estudiante} - ${c.asignatura}: <b>${c.nota}</b>
              </div>`
          )
          .join("")}
      </div>
    </div>
  `;
};
