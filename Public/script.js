const pantallaAuth = document.getElementById('pantallaAuth');
const pantallaApp = document.getElementById('pantallaApp');

const tabLogin = document.getElementById('tabLogin');
const tabRegistro = document.getElementById('tabRegistro');
const formLogin = document.getElementById('formLogin');
const formRegistro = document.getElementById('formRegistro');

const btnRegistro = document.getElementById('btnRegistro');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const btnCambiarCuenta = document.getElementById('btnCambiarCuenta');

const perfilNombre = document.getElementById('perfilNombre');
const perfilEmail = document.getElementById('perfilEmail');
const avatarUsuario = document.getElementById('avatarUsuario');

const colorPicker = document.getElementById('colorPicker');
const parteActual = document.getElementById('parteActual');
const btnGuardar = document.getElementById('btnGuardar');
const btnActualizar = document.getElementById('btnActualizar');
const btnCancelar = document.getElementById('btnCancelar');
const btnLimpiar = document.getElementById('btnLimpiar');
const contenedorCamisetas = document.getElementById('contenedorCamisetas');

let parteSeleccionada = null;

const partes = document.querySelectorAll('.parte-camiseta');

function obtenerToken() {
  return localStorage.getItem('tokenCamisa');
}

function obtenerUsuario() {
  const usuario = localStorage.getItem('usuarioCamisa');
  return usuario ? JSON.parse(usuario) : null;
}

function headersConToken() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${obtenerToken()}`
  };
}

function mostrarLogin() {
  pantallaAuth.classList.remove('oculto');
  pantallaApp.classList.add('oculto');
}

function mostrarApp() {
  const usuario = obtenerUsuario();

  if (!usuario || !obtenerToken()) {
    mostrarLogin();
    return;
  }

  perfilNombre.textContent = usuario.nombre;
  perfilEmail.textContent = usuario.email;
  avatarUsuario.textContent = usuario.nombre.charAt(0).toUpperCase();

  pantallaAuth.classList.add('oculto');
  pantallaApp.classList.remove('oculto');

  cargarCamisetas();
}

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('activo');
  tabRegistro.classList.remove('activo');

  formLogin.classList.remove('oculto');
  formRegistro.classList.add('oculto');
});

tabRegistro.addEventListener('click', () => {
  tabRegistro.classList.add('activo');
  tabLogin.classList.remove('activo');

  formRegistro.classList.remove('oculto');
  formLogin.classList.add('oculto');
});

// REGISTRO
btnRegistro.addEventListener('click', async () => {
  const nombre = document.getElementById('registroNombre').value.trim();
  const email = document.getElementById('registroEmail').value.trim();
  const clave = document.getElementById('registroClave').value.trim();

  if (!nombre || !email || !clave) {
    alert('Completa nombre, email y contraseña.');
    return;
  }

  try {
    const respuesta = await fetch('/api/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, clave })
    });

    const datos = await respuesta.json();
    alert(datos.mensaje);

    if (respuesta.ok) {
      document.getElementById('registroNombre').value = '';
      document.getElementById('registroEmail').value = '';
      document.getElementById('registroClave').value = '';

      tabLogin.click();
      document.getElementById('loginEmail').value = email;
    }

  } catch (error) {
    console.error(error);
    alert('Error al registrar usuario.');
  }
});

// LOGIN
btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const clave = document.getElementById('loginClave').value.trim();

  if (!email || !clave) {
    alert('Completa email y contraseña.');
    return;
  }

  try {
    const respuesta = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, clave })
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem('tokenCamisa', datos.token);
      localStorage.setItem('usuarioCamisa', JSON.stringify(datos.usuario));

      document.getElementById('loginEmail').value = '';
      document.getElementById('loginClave').value = '';

      mostrarApp();
    } else {
      alert(datos.mensaje);
    }

  } catch (error) {
    console.error(error);
    alert('Error al iniciar sesión.');
  }
});

function cerrarSesion() {
  localStorage.removeItem('tokenCamisa');
  localStorage.removeItem('usuarioCamisa');

  limpiarFormularioCompleto();
  mostrarLogin();
}

btnLogout.addEventListener('click', () => {
  cerrarSesion();
});

btnCambiarCuenta.addEventListener('click', () => {
  cerrarSesion();
});

// Seleccionar parte de la camiseta
partes.forEach((parte) => {
  parte.addEventListener('click', () => {
    partes.forEach((p) => p.classList.remove('parte-activa'));

    parteSeleccionada = parte;
    parteSeleccionada.classList.add('parte-activa');

    colorPicker.value = parte.getAttribute('fill');
    parteActual.textContent = `Parte seleccionada: ${parte.id}`;
  });
});

// Cambiar color
colorPicker.addEventListener('input', () => {
  if (parteSeleccionada) {
    parteSeleccionada.setAttribute('fill', colorPicker.value);
  } else {
    alert('Primero selecciona una parte de la camiseta.');
  }
});

btnLimpiar.addEventListener('click', () => {
  limpiarFormularioCompleto();
});

// CREATE
btnGuardar.addEventListener('click', async () => {
  if (!obtenerToken()) {
    alert('Debes iniciar sesión para guardar un diseño.');
    return;
  }

  const camiseta = obtenerDatosFormulario();

  if (!camiseta) return;

  try {
    const respuesta = await fetch('/api/camisetas', {
      method: 'POST',
      headers: headersConToken(),
      body: JSON.stringify(camiseta)
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      alert(datos.mensaje);
      limpiarFormularioCompleto();
      cargarCamisetas();
    } else {
      alert(datos.mensaje);
    }

  } catch (error) {
    console.error(error);
    alert('Error al guardar la camiseta.');
  }
});

// UPDATE
btnActualizar.addEventListener('click', async () => {
  if (!obtenerToken()) {
    alert('Debes iniciar sesión para actualizar un diseño.');
    return;
  }

  const id = document.getElementById('camisetaId').value;
  const camiseta = obtenerDatosFormulario();

  if (!id) {
    alert('No hay diseño seleccionado para actualizar.');
    return;
  }

  if (!camiseta) return;

  try {
    const respuesta = await fetch(`/api/camisetas/${id}`, {
      method: 'PUT',
      headers: headersConToken(),
      body: JSON.stringify(camiseta)
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      alert(datos.mensaje);
      limpiarFormularioCompleto();
      cargarCamisetas();
    } else {
      alert(datos.mensaje);
    }

  } catch (error) {
    console.error(error);
    alert('Error al actualizar la camiseta.');
  }
});

btnCancelar.addEventListener('click', () => {
  limpiarFormularioCompleto();
});

function obtenerDatosFormulario() {
  const nombreDiseno = document.getElementById('nombreDiseno').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (nombreDiseno === '') {
    alert('Debes escribir el nombre del diseño.');
    return null;
  }

  return {
    nombreDiseno,
    descripcion,
    torsoColor: document.getElementById('torso').getAttribute('fill'),
    mangaIzquierdaColor: document.getElementById('mangaIzquierda').getAttribute('fill'),
    mangaDerechaColor: document.getElementById('mangaDerecha').getAttribute('fill'),
    cuelloColor: document.getElementById('cuello').getAttribute('fill')
  };
}

function limpiarFormularioCompleto() {
  document.getElementById('camisetaId').value = '';
  document.getElementById('nombreDiseno').value = '';
  document.getElementById('descripcion').value = '';

  document.getElementById('torso').setAttribute('fill', '#ffffff');
  document.getElementById('mangaIzquierda').setAttribute('fill', '#ffffff');
  document.getElementById('mangaDerecha').setAttribute('fill', '#ffffff');
  document.getElementById('cuello').setAttribute('fill', '#ffffff');

  partes.forEach((parte) => parte.classList.remove('parte-activa'));

  parteSeleccionada = null;
  colorPicker.value = '#ffffff';
  parteActual.textContent = 'Selecciona una parte de la camisa';

  btnGuardar.classList.remove('oculto');
  btnActualizar.classList.add('oculto');
  btnCancelar.classList.add('oculto');
}

async function cargarCamisetas() {
  try {
    const respuesta = await fetch('/api/camisetas');
    const camisetas = await respuesta.json();

    const usuario = obtenerUsuario();

    contenedorCamisetas.innerHTML = '';

    if (camisetas.length === 0) {
      contenedorCamisetas.innerHTML = `
        <p class="mensaje-vacio">Todavía no hay diseños guardados.</p>
      `;
      return;
    }

    camisetas.forEach((camiseta) => {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('tarjeta-camiseta');

      const descripcion = camiseta.descripcion || 'Sin descripción.';
      const esCreador = usuario && camiseta.creador && camiseta.creador._id === usuario.id;

      tarjeta.innerHTML = `
        <div>
          <h3>${camiseta.nombreDiseno}</h3>
          <p><strong>Autor:</strong> ${camiseta.autor}</p>
          <p class="descripcion-card">${descripcion}</p>

          <div class="mini-camisa">
            <div class="color-box" style="background:${camiseta.torsoColor}" title="Torso"></div>
            <div class="color-box" style="background:${camiseta.mangaIzquierdaColor}" title="Manga izquierda"></div>
            <div class="color-box" style="background:${camiseta.mangaDerechaColor}" title="Manga derecha"></div>
            <div class="color-box" style="background:${camiseta.cuelloColor}" title="Cuello"></div>
          </div>
        </div>

        <div class="acciones-card">
          <div class="acciones-crud">
            ${
              esCreador
              ? `
                <button class="btn-edit" onclick='editarCamiseta(${JSON.stringify(camiseta)})'>
                  Editar
                </button>

                <button class="btn-delete" onclick="eliminarCamiseta('${camiseta._id}')">
                  Eliminar
                </button>
              `
              : '<p class="descripcion-card">Solo el creador puede editar o eliminar.</p>'
            }
          </div>
        </div>
      `;

      contenedorCamisetas.appendChild(tarjeta);
    });

  } catch (error) {
    console.error(error);
    alert('Error al cargar las camisetas.');
  }
}

function editarCamiseta(camiseta) {
  document.getElementById('camisetaId').value = camiseta._id;
  document.getElementById('nombreDiseno').value = camiseta.nombreDiseno;
  document.getElementById('descripcion').value = camiseta.descripcion || '';

  document.getElementById('torso').setAttribute('fill', camiseta.torsoColor);
  document.getElementById('mangaIzquierda').setAttribute('fill', camiseta.mangaIzquierdaColor);
  document.getElementById('mangaDerecha').setAttribute('fill', camiseta.mangaDerechaColor);
  document.getElementById('cuello').setAttribute('fill', camiseta.cuelloColor);

  partes.forEach((parte) => parte.classList.remove('parte-activa'));

  parteSeleccionada = null;
  colorPicker.value = '#ffffff';
  parteActual.textContent = 'Editando diseño. Selecciona una parte si deseas cambiar colores.';

  btnGuardar.classList.add('oculto');
  btnActualizar.classList.remove('oculto');
  btnCancelar.classList.remove('oculto');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

async function eliminarCamiseta(id) {
  if (!obtenerToken()) {
    alert('Debes iniciar sesión para eliminar un diseño.');
    return;
  }

  const confirmar = confirm('¿Seguro que deseas eliminar este diseño?');

  if (!confirmar) return;

  try {
    const respuesta = await fetch(`/api/camisetas/${id}`, {
      method: 'DELETE',
      headers: headersConToken()
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      alert(datos.mensaje);
      cargarCamisetas();
    } else {
      alert(datos.mensaje);
    }

  } catch (error) {
    console.error(error);
    alert('Error al eliminar la camiseta.');
  }
}

mostrarApp();