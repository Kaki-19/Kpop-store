const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');

// Mostrar formulario de registro
router.get('/registro', (req, res) => {
  res.render('auth/registro', { error: null });
});

// Procesar registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.render('auth/registro', { error: 'Ese email ya está registrado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, password: passwordHash });
    
    req.session.usuarioId = usuario._id;
    req.session.usuarioNombre = usuario.nombre;
    req.session.usuarioRol = usuario.rol;
    // Un usuario nuevo inicia con el carrito vacío
    req.session.carrito = []; 

    res.redirect('/productos');
  } catch (err) {
    res.render('auth/registro', { error: 'Error al registrar' });
  }
});

// Mostrar formulario de login
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Procesar login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.render('auth/login', { error: 'Email o contraseña incorrectos' });
    }
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.render('auth/login', { error: 'Email o contraseña incorrectos' });
    }
    
    req.session.usuarioId = usuario._id;
    req.session.usuarioNombre = usuario.nombre;
    req.session.usuarioRol = usuario.rol;
    
    // ✨ RECOVERY: Traemos el carrito persistido en MongoDB y lo cargamos en la sesión activa
    req.session.carrito = usuario.carrito || [];

    res.redirect('/productos');
  } catch (err) {
    res.render('auth/login', { error: 'Error al iniciar sesión' });
  }
});

// Logout (Modificado para ser asíncrono y respaldar el carrito en la Base de Datos)
router.get('/logout', async (req, res) => {
  try {
    // Si hay un usuario logueado, respaldamos su carrito actual de la sesión en MongoDB
    if (req.session && req.session.usuarioId) {
      await Usuario.findByIdAndUpdate(req.session.usuarioId, {
        carrito: req.session.carrito || []
      });
    }

    // Una vez guardado de forma segura, destruimos la sesión
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Error al destruir la sesión durante el logout:', err);
      }
      res.redirect('/auth/login');
    });

  } catch (err) {
    console.error('❌ Error en el proceso de logout:', err);
    // En caso de un fallo crítico, forzamos la redirección para que no se quede congelada la app
    res.redirect('/auth/login'); 
  }
});

module.exports = router;