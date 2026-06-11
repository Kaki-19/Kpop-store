const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const auth = require('../middleware/auth');

// IMPORTANTE: Importamos las herramientas de Cloudinary que configuramos
const { upload, subirACloudinary } = require('../cloudinaryConfig');

// READ - Listar todos los productos (Modificado para enviar el ROL)
router.get('/', auth, async (req, res) => {
  try {
    const productos = await Producto.find();
    
    // Renderizamos pasando el rol almacenado en la sesión
    res.render('productos/index', { 
      productos, 
      usuario: req.session.usuarioNombre,
      rol: req.session.usuarioRol || 'cliente' // Si por algo no tiene, por defecto es cliente
    });
  } catch (err) {
    console.error("Error al cargar productos:", err);
    res.send('Error al cargar productos');
  }
});

// CREATE - Mostrar formulario (Solo Admin)
router.get('/nuevo', auth, (req, res) => {
  // Protección extra: Si no es admin, lo mandamos al catálogo normal
  if (req.session.usuarioRol !== 'admin') {
    return res.redirect('/productos');
  }
  res.render('productos/nuevo', { error: null });
});

// CREATE - Guardar producto (Solo Admin - Modificado para Cloudinary)
router.post('/nuevo', auth, upload.single('imagen'), async (req, res) => {
  if (req.session.usuarioRol !== 'admin') {
    return res.redirect('/productos');
  }

  try {
    const { nombre, artista, categoria, precio, stock, descripcion } = req.body;
    
    let imagenUrl = '';

    // Si el usuario subió una imagen, la mandamos a Cloudinary
    if (req.file) {
      const resultadoCloudinary = await subirACloudinary(req.file.buffer);
      imagenUrl = resultadoCloudinary.secure_url; // Guardamos la URL segura
    }

    // Creamos el producto incluyendo la URL de la imagen
    const producto = new Producto({ 
      nombre, 
      artista, 
      categoria, 
      precio, 
      stock, 
      descripcion,
      imagenUrl 
    });

    await producto.save();
    res.redirect('/productos');
  } catch (err) {
    console.error("Error al guardar producto:", err);
    res.render('productos/nuevo', { error: 'Error al guardar producto' });
  }
});

// UPDATE - Mostrar formulario de edición (Solo Admin)
router.get('/editar/:id', auth, async (req, res) => {
  if (req.session.usuarioRol !== 'admin') {
    return res.redirect('/productos');
  }

  try {
    const producto = await Producto.findById(req.params.id);
    res.render('productos/editar', { producto, error: null });
  } catch (err) {
    res.redirect('/productos');
  }
});

// UPDATE - Guardar cambios (Solo Admin - SOPORTA PRODUCTOS VIEJOS)
router.post('/editar/:id', auth, upload.single('imagen'), async (req, res) => {
  if (req.session.usuarioRol !== 'admin') {
    return res.redirect('/productos');
  }

  try {
    const { nombre, artista, categoria, precio, stock, descripcion } = req.body;
    
    // Preparamos los campos básicos modificados
    let datosActualizados = { nombre, artista, categoria, precio, stock, descripcion };

    // Si el usuario seleccionó una nueva foto en el formulario, la subimos
    if (req.file) {
      const resultadoCloudinary = await subirACloudinary(req.file.buffer);
      datosActualizados.imagenUrl = resultadoCloudinary.secure_url; 
    }

    // Actualizamos y limpiamos el rastro del campo viejo si existía
    await Producto.findByIdAndUpdate(req.params.id, {
      $set: datosActualizados,
      $unset: { imagen: "" } 
    });

    res.redirect('/productos');
  } catch (err) {
    console.error("Error al editar producto:", err);
    res.redirect('/productos');
  }
});

// DELETE - Eliminar producto (Solo Admin)
router.post('/eliminar/:id', auth, async (req, res) => {
  if (req.session.usuarioRol !== 'admin') {
    return res.redirect('/productos');
  }

  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.redirect('/productos');
  } catch (err) {
    res.redirect('/productos');
  }
});

/* ==========================================================================
   🛍️ RUTAS DE COMPRA MODIFICADAS: FLUJO CON FORMULARIO DE ENVÍO
   ========================================================================== */

// 1. COMPRA DIRECTA (Paso 1): Muestra el formulario de envío para un solo producto
router.get('/comprar/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto || producto.stock <= 0) {
      return res.redirect('/productos');
    }
    // Renderizamos la vista del formulario pasando la URL de destino correspondiente
    res.render('productos/envio', { 
      actionUrl: `/productos/comprar/${producto._id}/procesar` 
    });
  } catch (err) {
    console.error("Error al abrir envío para compra directa:", err);
    res.redirect('/productos');
  }
});

// 2. COMPRA DIRECTA (Paso 2): Procesa el formulario, descuenta stock y confirma
router.post('/comprar/:id/procesar', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto || producto.stock <= 0) {
      return res.redirect('/productos');
    }

    // Extraemos los datos capturados en el formulario
    const { nombreDestinatario, direccion, ciudad, cp } = req.body;

    // Reducimos 1 unidad del stock en la base de datos
    await Producto.findByIdAndUpdate(req.params.id, { $inc: { stock: -1 } });

    // Renderizamos el HTML de éxito incluyendo los datos recolectados
    res.send(obtenerHtmlExito(nombreDestinatario, `${direccion}, ${ciudad}, C.P. ${cp}`));
  } catch (err) {
    console.error("Error al procesar compra directa:", err);
    res.redirect('/productos');
  }
});

// 3. CHECKOUT TOTAL (Paso 1): Muestra el formulario de envío para todo el carrito
router.get('/checkout-simulado', auth, async (req, res) => {
  try {
    const carrito = req.session.carrito || [];
    if (carrito.length === 0) {
      return res.redirect('/productos');
    }
    // Renderizamos enviando la acción hacia la ruta de procesamiento del carrito
    res.render('productos/envio', { 
      actionUrl: '/productos/checkout-simulado/procesar' 
    });
  } catch (err) {
    console.error("Error al abrir envío para checkout:", err);
    res.redirect('/carrito');
  }
});

// 4. CHECKOUT TOTAL (Paso 2): Procesa el formulario, descuenta todo el stock y limpia el carrito
router.post('/checkout-simulado/procesar', auth, async (req, res) => {
  try {
    const carrito = req.session.carrito || [];
    if (carrito.length === 0) {
      return res.redirect('/productos');
    }

    const { nombreDestinatario, direccion, ciudad, cp } = req.body;

    // Recorremos el carrito para descontar las cantidades exactas de cada ítem en MongoDB
    for (const item of carrito) {
      await Producto.findByIdAndUpdate(item.id, {
        $inc: { stock: -item.cantidad } 
      });
    }

    // Vaciamos el carrito de la sesión
    req.session.carrito = [];

    // Renderizamos pasándole la dirección dinámica obtenida
    res.send(obtenerHtmlExito(nombreDestinatario, `${direccion}, ${ciudad}, C.P. ${cp}`));
  } catch (err) {
    console.error("Error en el procesamiento del checkout total:", err);
    res.redirect('/carrito');
  }
});

// Función auxiliar modificada para imprimir de forma estética la dirección e información ingresada
function obtenerHtmlExito(destinatario, direccionCompleta) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>¡Compra Exitosa! - KPop Store</title>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Nunito', sans-serif; background: #fdf6ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
        .success-card { background: white; padding: 3.5rem 2rem; border-radius: 24px; text-align: center; box-shadow: 0 4px 16px rgba(255,182,217,0.15); border: 2px solid #ffeef8; max-width: 480px; width: 100%; }
        h1 { color: #ff9de2; font-weight: 800; font-size: 2.1rem; margin-bottom: 0.5rem; }
        p { color: #666; font-weight: 600; margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.5; }
        .shipping-box { background: #fffcfd; border: 2px dashed #ffe4f3; padding: 1.2rem; border-radius: 16px; margin-bottom: 2rem; text-align: left; }
        .shipping-box h3 { font-size: 0.9rem; color: #b39ddb; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
        .shipping-box p { margin: 0; color: #777; font-size: 0.9rem; font-weight: 700; }
        .btn { background: linear-gradient(135deg, #ff9de2, #b39ddb); color: white; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 12px; display: inline-block; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(255,157,226,0.3); }
        .btn:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="success-card">
        <div style="font-size: 4.5rem; margin-bottom: 1rem;">🎉🌸</div>
        <h1>¡Pedido Confirmado!</h1>
        <p>¡Muchas gracias por tu orden! Tu pago ha sido procesado de forma simulada con éxito.</p>
        
        <div class="shipping-box">
          <h3>📦 Información del Envío:</h3>
          <p style="color: #444; margin-bottom: 5px;"><strong>Destinatario:</strong> ${destinatario}</p>
          <p><strong>Dirección:</strong> ${direccionCompleta}</p>
        </div>
        
        <a href="/productos" class="btn">Seguir Comprando ✨</a>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;