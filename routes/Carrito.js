const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario'); 
const Pedido = require('../models/Pedido'); 
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  if (!req.session.carrito) req.session.carrito = [];
  let total = 0;
  req.session.carrito.forEach(item => total += item.precio * item.cantidad);
  const success = req.query.success === 'true';
  res.render('productos/carrito', { 
      carrito: req.session.carrito, 
      total: total, 
      usuario: req.session.usuarioNombre, 
      rol: req.session.usuarioRol, 
      success: success 
  });
});

// Ruta corregida para agregar productos
router.post('/agregar/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ success: false, message: "Producto no encontrado" });

    if (!req.session.carrito) req.session.carrito = [];

    // Verificamos si ya existe en el carrito
    const itemExistente = req.session.carrito.find(item => item.id === req.params.id);
    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      req.session.carrito.push({
        id: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenUrl: producto.imagenUrl,
        cantidad: 1
      });
    }

    const cantidadTotal = req.session.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    
    // Respondemos con JSON para que el frontend (fetch) lo entienda
    res.json({ success: true, cantidadTotal: cantidadTotal });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al agregar al carrito" });
  }
});

router.get('/envio', auth, (req, res) => {
    res.render('productos/envio', { usuario: req.session.usuarioNombre });
});

router.post('/comprar', auth, async (req, res) => {
  try {
    if (!req.session.carrito || req.session.carrito.length === 0) return res.redirect('/carrito');
    const { nombreDestinatario, direccion, ciudad, cp, telefono } = req.body; 
    let totalCompra = 0;
    const itemsPedido = req.session.carrito.map(item => {
      totalCompra += item.precio * item.cantidad;
      return { producto: item.id, cantidad: item.cantidad, precioUnitario: item.precio };
    });
    const nuevoPedido = new Pedido({
      usuario: req.session.usuarioId,
      items: itemsPedido,
      total: totalCompra,
      direccion: `Destinatario: ${nombreDestinatario}, Dir: ${direccion}, Ciudad: ${ciudad}, CP: ${cp}, Tel: ${telefono}`
    });
    await nuevoPedido.save();
    for (const item of req.session.carrito) {
      await Producto.findByIdAndUpdate(item.id, { $inc: { stock: -item.cantidad } });
    }
    req.session.carrito = [];
    if (req.session.usuarioId) await Usuario.findByIdAndUpdate(req.session.usuarioId, { carrito: [] });
    if (req.io) req.io.emit('nuevoPedido', { id: nuevoPedido._id, cliente: req.session.usuarioNombre, total: totalCompra, fecha: new Date().toLocaleTimeString() });
    res.redirect('/carrito?success=true');
  } catch (err) {
    res.redirect('/carrito');
  }
});

router.get('/vaciar', auth, async (req, res) => {
    req.session.carrito = [];
    res.redirect('/carrito');
});

module.exports = router;