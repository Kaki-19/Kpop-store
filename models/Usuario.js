const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  rol:      { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  
  // ✨ NUEVO CAMPO: Arreglo para persistir los artículos del carrito
  carrito: [{
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Producto', // Hace referencia a tu modelo de Producto
      required: true 
    },
    nombre:    { type: String, required: true },
    artista:   { type: String, required: true },
    precio:    { type: Number, required: true },
    imagenUrl: { type: String, default: '' },
    categoria: { type: String, required: true },
    cantidad:  { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);