require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('./models/usuario');
const Producto = require('./models/Producto');
const Pedido = require('./models/Pedido');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  // Limpiar datos anteriores
  await Usuario.deleteMany();
  await Producto.deleteMany();
  await Pedido.deleteMany();
  console.log('🗑️ Datos anteriores eliminados');

  // Crear usuario demo
  const passwordHash = await bcrypt.hash('Demo1234', 10);
  const demo = await Usuario.create({
    nombre: 'Demo User',
    email: 'demo@demo.com',
    password: passwordHash,
    rol: 'admin'
  });

  // Crear productos
  const productos = await Producto.insertMany([
    { nombre: 'Map of the Soul: 7', artista: 'BTS', categoria: 'album', precio: 350, stock: 15, descripcion: 'Album físico con photocards' },
    { nombre: 'Born Pink', artista: 'BLACKPINK', categoria: 'album', precio: 320, stock: 10, descripcion: 'Album edición especial' },
    { nombre: 'Photocard Jimin', artista: 'BTS', categoria: 'photocard', precio: 80, stock: 50, descripcion: 'Photocard oficial' },
    { nombre: 'Lightstick Army Bomb', artista: 'BTS', categoria: 'lightstick', precio: 650, stock: 8, descripcion: 'Versión 4' },
    { nombre: 'Hoodie BLACKPINK', artista: 'BLACKPINK', categoria: 'ropa', precio: 480, stock: 20, descripcion: 'Talla M' },
  ]);
  console.log('📦 Productos creados');

  // Crear pedido de ejemplo
  await Pedido.create({
    usuario: demo._id,
    items: [{ producto: productos[0]._id, cantidad: 2, precioUnitario: productos[0].precio }],
    total: productos[0].precio * 2,
    estado: 'pendiente',
    direccion: 'Calle Sakura 123, CDMX'
  });
  console.log('🛒 Pedido de ejemplo creado');

  console.log('✅ Seed completado');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});