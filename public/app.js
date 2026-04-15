if (!localStorage.getItem('usuario_conectado')) {
  alert('Acceso denegado. Debes iniciar sesión.');
  window.location.href = 'login.html';
}

const usuarioEmail = document.getElementById('usuario-email');
const btnLogout = document.getElementById('btn-logout');
const formPrenda = document.getElementById('form-prenda');
const tablaPrendas = document.getElementById('tabla-prendas');
const mensajePrenda = document.getElementById('mensaje-prenda');
const tituloFormulario = document.getElementById('titulo-formulario');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

const inputId = document.getElementById('prenda-id');
const inputNombre = document.getElementById('nombre');
const inputCategoria = document.getElementById('categoria');
const inputMarca = document.getElementById('marca');
const inputTalla = document.getElementById('talla');
const inputColor = document.getElementById('color');
const inputStock = document.getElementById('stock');
const inputPrecio = document.getElementById('precio');
const inputDescripcion = document.getElementById('descripcion');
const inputSku = document.getElementById('codigo_sku');

if (usuarioEmail) {
  usuarioEmail.textContent = localStorage.getItem('usuario_email') || 'No disponible';
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('usuario_conectado');
    localStorage.removeItem('usuario_email');
    window.location.href = 'login.html';
  });
}

function mostrarMensaje(texto, tipo = 'exito') {
  mensajePrenda.textContent = texto;
  mensajePrenda.className = `mensaje ${tipo}`;
}

function limpiarFormulario() {
  inputId.value = '';
  inputNombre.value = '';
  inputCategoria.value = '';
  inputMarca.value = '';
  inputTalla.value = '';
  inputColor.value = '';
  inputStock.value = '';
  inputPrecio.value = '';
  inputDescripcion.value = '';
  inputSku.value = '';

  tituloFormulario.textContent = 'Agregar prenda';
  btnGuardar.textContent = 'Guardar prenda';
  btnCancelar.style.display = 'none';
}

function llenarFormulario(prenda) {
  inputId.value = prenda.id;
  inputNombre.value = prenda.nombre;
  inputCategoria.value = prenda.categoria;
  inputMarca.value = prenda.marca || '';
  inputTalla.value = prenda.talla;
  inputColor.value = prenda.color;
  inputStock.value = prenda.stock;
  inputPrecio.value = prenda.precio;
  inputDescripcion.value = prenda.descripcion || '';
  inputSku.value = prenda.codigo_sku || '';

  tituloFormulario.textContent = 'Editar prenda';
  btnGuardar.textContent = 'Actualizar prenda';
  btnCancelar.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cargarPrendas() {
  try {
    const respuesta = await fetch('/api/prendas');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      tablaPrendas.innerHTML = `
        <tr>
          <td colspan="10">No se pudieron cargar las prendas</td>
        </tr>
      `;
      return;
    }

    if (data.prendas.length === 0) {
      tablaPrendas.innerHTML = `
        <tr>
          <td colspan="10">No hay prendas registradas</td>
        </tr>
      `;
      return;
    }

    tablaPrendas.innerHTML = data.prendas.map((prenda) => `
      <tr>
        <td>${prenda.id}</td>
        <td>${prenda.nombre}</td>
        <td>${prenda.categoria}</td>
        <td>${prenda.marca || '-'}</td>
        <td>${prenda.talla}</td>
        <td>${prenda.color}</td>
        <td>${prenda.stock}</td>
        <td>$${Number(prenda.precio).toFixed(2)}</td>
        <td>${prenda.codigo_sku || '-'}</td>
        <td>
          <div class="acciones-tabla">
            <button class="btn btn-editar" onclick='editarPrenda(${JSON.stringify(prenda)})'>Editar</button>
            <button class="btn btn-danger" onclick="eliminarPrenda(${prenda.id})">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error al cargar prendas:', error);
    tablaPrendas.innerHTML = `
      <tr>
        <td colspan="10">Error de conexión con el servidor</td>
      </tr>
    `;
  }
}

formPrenda.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = inputId.value;

  const datos = {
    nombre: inputNombre.value.trim(),
    categoria: inputCategoria.value.trim(),
    marca: inputMarca.value.trim(),
    talla: inputTalla.value.trim(),
    color: inputColor.value.trim(),
    stock: Number(inputStock.value),
    precio: Number(inputPrecio.value),
    descripcion: inputDescripcion.value.trim(),
    codigo_sku: inputSku.value.trim()
  };

  try {
    const url = id ? `/api/prendas/${id}` : '/api/prendas';
    const metodo = id ? 'PUT' : 'POST';

    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(data.mensaje || 'Ocurrió un error', 'error');
      return;
    }

    mostrarMensaje(data.mensaje, 'exito');
    limpiarFormulario();
    cargarPrendas();
  } catch (error) {
    console.error('Error al guardar prenda:', error);
    mostrarMensaje('Error de conexión con el servidor', 'error');
  }
});

btnCancelar.addEventListener('click', () => {
  limpiarFormulario();
  mostrarMensaje('', 'exito');
});

window.editarPrenda = (prenda) => {
  llenarFormulario(prenda);
};

window.eliminarPrenda = async (id) => {
  const confirmar = confirm('¿Seguro que deseas eliminar esta prenda?');
  if (!confirmar) return;

  try {
    const respuesta = await fetch(`/api/prendas/${id}`, {
      method: 'DELETE'
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(data.mensaje || 'No se pudo eliminar', 'error');
      return;
    }

    mostrarMensaje(data.mensaje, 'exito');
    cargarPrendas();
  } catch (error) {
    console.error('Error al eliminar prenda:', error);
    mostrarMensaje('Error de conexión con el servidor', 'error');
  }
};

cargarPrendas();