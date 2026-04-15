if (!localStorage.getItem('usuario_conectado')) {
  alert('Acceso denegado. Debes iniciar sesión.');
  window.location.href = 'login.html';
}

const usuarioEmail = document.getElementById('usuario-email');
const btnLogout = document.getElementById('btn-logout');

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