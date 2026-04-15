const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'inventario_user',
  host: 'localhost',
  database: 'inventario_db',
  password: 'Inventario123',
  port: 5432
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      mensaje: 'Conexión exitosa con PostgreSQL',
      fecha_servidor: result.rows[0].now
    });
  } catch (error) {
    console.error('Error en /api/test-db:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error de conexión con PostgreSQL',
      error: error.message
    });
  }
});

/* =========================
   AUTENTICACIÓN
========================= */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Email y contraseña son obligatorios'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Ese correo ya está registrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, creado_en`,
      [emailNormalizado, passwordHash]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente',
      usuario: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar usuario',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Email y contraseña son obligatorios'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const usuario = resultado.rows[0];
    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordCorrecta) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Contraseña incorrecta'
      });
    }

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: usuario.id,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
});

/* =========================
   CRUD DE PRENDAS
========================= */

app.get('/api/prendas', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM prendas ORDER BY id ASC'
    );

    res.json({
      ok: true,
      total: resultado.rows.length,
      prendas: resultado.rows
    });
  } catch (error) {
    console.error('Error al obtener prendas:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las prendas',
      error: error.message
    });
  }
});

app.post('/api/prendas', async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      marca,
      talla,
      color,
      stock,
      precio,
      descripcion,
      codigo_sku
    } = req.body;

    if (!nombre || !categoria || !talla || !color || stock === undefined || precio === undefined) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Nombre, categoría, talla, color, stock y precio son obligatorios'
      });
    }

    if (Number(stock) < 0 || Number(precio) < 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Stock y precio no pueden ser negativos'
      });
    }

    const resultado = await pool.query(
      `INSERT INTO prendas
      (nombre, categoria, marca, talla, color, stock, precio, descripcion, codigo_sku)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        nombre.trim(),
        categoria.trim(),
        marca ? marca.trim() : null,
        talla.trim(),
        color.trim(),
        Number(stock),
        Number(precio),
        descripcion ? descripcion.trim() : null,
        codigo_sku ? codigo_sku.trim() : null
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Prenda creada correctamente',
      prenda: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al crear prenda:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        mensaje: 'El código SKU ya existe'
      });
    }

    res.status(500).json({
      ok: false,
      mensaje: 'Error al crear la prenda',
      error: error.message
    });
  }
});

app.put('/api/prendas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      categoria,
      marca,
      talla,
      color,
      stock,
      precio,
      descripcion,
      codigo_sku
    } = req.body;

    if (!nombre || !categoria || !talla || !color || stock === undefined || precio === undefined) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Nombre, categoría, talla, color, stock y precio son obligatorios'
      });
    }

    if (Number(stock) < 0 || Number(precio) < 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Stock y precio no pueden ser negativos'
      });
    }

    const resultado = await pool.query(
      `UPDATE prendas
       SET nombre = $1,
           categoria = $2,
           marca = $3,
           talla = $4,
           color = $5,
           stock = $6,
           precio = $7,
           descripcion = $8,
           codigo_sku = $9
       WHERE id = $10
       RETURNING *`,
      [
        nombre.trim(),
        categoria.trim(),
        marca ? marca.trim() : null,
        talla.trim(),
        color.trim(),
        Number(stock),
        Number(precio),
        descripcion ? descripcion.trim() : null,
        codigo_sku ? codigo_sku.trim() : null,
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Prenda no encontrada'
      });
    }

    res.json({
      ok: true,
      mensaje: 'Prenda actualizada correctamente',
      prenda: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar prenda:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        mensaje: 'El código SKU ya existe'
      });
    }

    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar la prenda',
      error: error.message
    });
  }
});

app.delete('/api/prendas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'DELETE FROM prendas WHERE id = $1 RETURNING *',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Prenda no encontrada'
      });
    }

    res.json({
      ok: true,
      mensaje: 'Prenda eliminada correctamente',
      prenda: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar prenda:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la prenda',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});