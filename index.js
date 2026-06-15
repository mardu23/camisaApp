const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('./esquemaUsuario');
const Camiseta = require('./esquemaCamiseta');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'clave_secreta_camisa_gen_2027';

// ==========================
// MIDDLEWARES
// ==========================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

// ==========================
// CONEXIÓN A MONGODB LOCAL
// ==========================

mongoose.connect('mongodb+srv://2019473_db_user:nana2301@cluster0.tartnjo.mongodb.net/camisaApp?retryWrites=true&w=majority')
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas correctamente');
  })
  .catch((error) => {
    console.error('❌ Error al conectar con MongoDB Atlas:', error);
  });
// ==========================
// MIDDLEWARE JWT
// ==========================

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para realizar esta acción.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      mensaje: 'Token no enviado correctamente.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.usuarioId = decoded.id;
    req.usuarioNombre = decoded.nombre;
    req.usuarioEmail = decoded.email;

    next();

  } catch (error) {
    return res.status(403).json({
      mensaje: 'Tu sesión expiró o el token no es válido. Inicia sesión otra vez.'
    });
  }
}

// ==========================
// RUTAS PRINCIPALES
// ==========================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ==========================
// RUTAS DE AUTENTICACIÓN
// ==========================

// REGISTRO
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, clave } = req.body;

    if (!nombre || !email || !clave) {
      return res.status(400).json({
        mensaje: 'Nombre, email y contraseña son obligatorios.'
      });
    }

    if (clave.length < 4) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 4 caracteres.'
      });
    }

    const usuarioExistente = await Usuario.findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({
        mensaje: 'Ya existe un usuario con ese email.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const claveEncriptada = await bcrypt.hash(clave, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      clave: claveEncriptada
    });

    await nuevoUsuario.save();

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente. Ahora puedes iniciar sesión.'
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar usuario.',
      error: error.message
    });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, clave } = req.body;

    if (!email || !clave) {
      return res.status(400).json({
        mensaje: 'Email y contraseña son obligatorios.'
      });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas.'
      });
    }

    const claveCorrecta = await bcrypt.compare(clave, usuario.clave);

    if (!claveCorrecta) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas.'
      });
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      },
      JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );

    res.json({
      mensaje: 'Inicio de sesión correcto.',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al iniciar sesión.',
      error: error.message
    });
  }
});

// DATOS DEL USUARIO LOGUEADO
app.get('/api/me', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('-clave');

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado.'
      });
    }

    res.json(usuario);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuario.',
      error: error.message
    });
  }
});

// SOLO PARA PRUEBA
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-clave');
    res.json(usuarios);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuarios.',
      error: error.message
    });
  }
});

// ==========================
// RUTAS DE CAMISETAS - CRUD
// ==========================

// CREATE - Crear diseño protegido
app.post('/api/camisetas', verificarToken, async (req, res) => {
  try {
    const {
      nombreDiseno,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    } = req.body;

    if (!nombreDiseno) {
      return res.status(400).json({
        mensaje: 'El nombre del diseño es obligatorio.'
      });
    }

    const nuevaCamiseta = new Camiseta({
      nombreDiseno,
      autor: req.usuarioNombre,
      creador: req.usuarioId,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    });

    const camisetaGuardada = await nuevaCamiseta.save();

    res.status(201).json({
      mensaje: 'Diseño de camiseta guardado correctamente.',
      camiseta: camisetaGuardada
    });

  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al guardar la camiseta.',
      error: error.message
    });
  }
});

// READ - Obtener todos los diseños
app.get('/api/camisetas', async (req, res) => {
  try {
    const camisetas = await Camiseta.find()
      .populate('creador', 'nombre email')
      .sort({ fechaCreacion: -1 });

    res.json(camisetas);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las camisetas.',
      error: error.message
    });
  }
});

// READ - Obtener un diseño por ID
app.get('/api/camisetas/:id', async (req, res) => {
  try {
    const camiseta = await Camiseta.findById(req.params.id)
      .populate('creador', 'nombre email');

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada.'
      });
    }

    res.json(camiseta);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la camiseta.',
      error: error.message
    });
  }
});

// UPDATE - Actualizar diseño protegido
app.put('/api/camisetas/:id', verificarToken, async (req, res) => {
  try {
    const camiseta = await Camiseta.findById(req.params.id);

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada.'
      });
    }

    if (camiseta.creador.toString() !== req.usuarioId) {
      return res.status(403).json({
        mensaje: 'Solo el creador puede editar este diseño.'
      });
    }

    const {
      nombreDiseno,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    } = req.body;

    camiseta.nombreDiseno = nombreDiseno;
    camiseta.descripcion = descripcion;
    camiseta.torsoColor = torsoColor;
    camiseta.mangaIzquierdaColor = mangaIzquierdaColor;
    camiseta.mangaDerechaColor = mangaDerechaColor;
    camiseta.cuelloColor = cuelloColor;
    camiseta.actualizadoEn = Date.now();

    const camisetaActualizada = await camiseta.save();

    res.json({
      mensaje: 'Diseño actualizado correctamente.',
      camiseta: camisetaActualizada
    });

  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al actualizar la camiseta.',
      error: error.message
    });
  }
});

// DELETE - Eliminar diseño protegido
app.delete('/api/camisetas/:id', verificarToken, async (req, res) => {
  try {
    const camiseta = await Camiseta.findById(req.params.id);

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada.'
      });
    }

    if (camiseta.creador.toString() !== req.usuarioId) {
      return res.status(403).json({
        mensaje: 'Solo el creador puede eliminar este diseño.'
      });
    }

    await Camiseta.findByIdAndDelete(req.params.id);

    res.json({
      mensaje: 'Camiseta eliminada correctamente.'
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la camiseta.',
      error: error.message
    });
  }
});

// VOTAR - Ruta protegida
app.post('/api/camisetas/:id/votar', verificarToken, async (req, res) => {
  try {
    const valorVoto = Number(req.body.valor);

    if (valorVoto < 1 || valorVoto > 5) {
      return res.status(400).json({
        mensaje: 'El voto debe estar entre 1 y 5.'
      });
    }

    const camiseta = await Camiseta.findById(req.params.id);

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada.'
      });
    }

    const yaVoto = camiseta.votos.find(
      (voto) => voto.usuario.toString() === req.usuarioId
    );

    if (yaVoto) {
      return res.status(400).json({
        mensaje: 'Ya votaste por este diseño.'
      });
    }

    camiseta.votos.push({
      usuario: req.usuarioId,
      valor: valorVoto
    });

    camiseta.calcularCalificacion();
    camiseta.actualizadoEn = Date.now();

    await camiseta.save();

    res.json({
      mensaje: 'Voto registrado correctamente.',
      calificacion: camiseta.calificacion,
      totalVotos: camiseta.votos.length
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al votar.',
      error: error.message
    });
  }
});

// ==========================
// SERVIDOR
// ==========================

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// ==========================
// Lo que dijo el profe
// ==========================
