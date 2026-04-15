const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const mensaje = document.getElementById('mensaje');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();

    mensaje.textContent = '';

    try {
      const respuesta = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        mensaje.textContent = data.mensaje || 'No se pudo registrar el usuario';
        mensaje.className = 'mensaje error';
        return;
      }

      mensaje.textContent = data.mensaje;
      mensaje.className = 'mensaje exito';

      registerForm.reset();

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (error) {
      console.error('Error en registro:', error);
      mensaje.textContent = 'Error de conexión con el servidor';
      mensaje.className = 'mensaje error';
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    mensaje.textContent = '';

    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        mensaje.textContent = data.mensaje || 'No se pudo iniciar sesión';
        mensaje.className = 'mensaje error';
        return;
      }

      localStorage.setItem('usuario_conectado', 'true');
      localStorage.setItem('usuario_email', data.usuario.email);

      mensaje.textContent = data.mensaje;
      mensaje.className = 'mensaje exito';

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } catch (error) {
      console.error('Error en login:', error);
      mensaje.textContent = 'Error de conexión con el servidor';
      mensaje.className = 'mensaje error';
    }
  });
}