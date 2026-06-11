const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const auth = require('../middleware/auth');

// DASHBOARD (Vista de Administrador Global)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const pedidos = await Pedido.find({})
      .populate('items.producto');

    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const totalPedidos = pedidos.length;
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado').length;
    const pedidosEnviados = pedidos.filter(p => p.estado === 'enviado').length;
    const pedidosCancelados = pedidos.filter(p => p.estado === 'cancelado').length;

    const productosMap = {};
    pedidos.forEach(p => {
      p.items.forEach(item => {
        if (item.producto) {
          const id = item.producto._id.toString();
          if (!productosMap[id]) {
            productosMap[id] = { nombre: item.producto.nombre, artista: item.producto.artista, cantidad: 0, ingresos: 0 };
          }
          productosMap[id].cantidad += item.cantidad;
          productosMap[id].ingresos += item.precioUnitario * item.cantidad;
        }
      });
    });
    const topProductos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    res.render('dashboard', {
      usuario: req.session.usuarioNombre,
      totalVentas, totalPedidos,
      pedidosPendientes, pedidosEntregados,
      pedidosEnviados, pedidosCancelados,
      topProductos
    });
  } catch (err) {
    res.redirect('/productos');
  }
});

// READ - Listar pedidos globales
router.get('/', auth, async (req, res) => {
  try {
    const pedidos = await Pedido.find({})
      .populate('items.producto');
    res.render('pedidos/index', { pedidos, usuario: req.session.usuarioNombre });
  } catch (err) {
    res.send('Error al cargar pedidos');
  }
});

// CREATE - Mostrar formulario
router.get('/nuevo', auth, async (req, res) => {
  try {
    const productos = await Producto.find({ stock: { $gt: 0 } });
    res.render('pedidos/nuevo', { productos, error: null });
  } catch (err) {
    res.redirect('/pedidos');
  }
});

// CREATE - Guardar pedido manual 
router.post('/nuevo', auth, async (req, res) => {
  try {
    const { productoId, cantidad, direccion } = req.body;
    const producto = await Producto.findById(productoId);
    if (!producto) return res.redirect('/pedidos/nuevo');

    const precioUnitario = producto.precio;
    const total = precioUnitario * cantidad;

    const pedido = new Pedido({
      usuario: req.session.usuarioId,
      items: [{ producto: productoId, cantidad, precioUnitario }],
      total,
      direccion
    });
    await pedido.save();

    await Producto.findByIdAndUpdate(productoId, { $inc: { stock: -cantidad } });

    // ✨ CORRECCIÓN DE WEBSOCKET: Ajustamos los parámetros para que coincidan con la vista index.ejs
    req.io.emit('nuevoPedido', {
      id: pedido._id,
      cliente: req.session.usuarioNombre || 'Cliente de la Tienda',
      total: total,
      direccion: direccion || 'Sin dirección',
      fecha: new Date().toLocaleTimeString()
    });

    res.redirect('/pedidos');
  } catch (err) {
    res.redirect('/pedidos/nuevo');
  }
});

// UPDATE - Mostrar formulario editar
router.get('/editar/:id', auth, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('items.producto');
    res.render('pedidos/editar', { pedido, error: null });
  } catch (err) {
    res.redirect('/pedidos');
  }
});

// UPDATE - Guardar cambios 
router.post('/editar/:id', auth, async (req, res) => {
  try {
    const { estado, direccion } = req.body;
    await Pedido.findByIdAndUpdate(req.params.id, { estado, direccion });

    // ✨ EMISIÓN DE WEBSOCKET: Notifica un cambio global en los estados
    req.io.emit('actualizarDashboard');

    res.redirect('/pedidos');
  } catch (err) {
    res.redirect('/pedidos');
  }
});

// DELETE - Eliminar pedido
router.post('/eliminar/:id', auth, async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);

    // ✨ EMISIÓN DE WEBSOCKET: Notifica una eliminación de orden
    req.io.emit('actualizarDashboard');

    res.redirect('/pedidos');
  } catch (err) {
    res.redirect('/pedidos');
  }
});

module.exports = router;