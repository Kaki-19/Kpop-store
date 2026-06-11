const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  artista:     { type: String, required: true, trim: true },
  categoria:   { type: String, required: true, enum: ['album', 'photocard', 'lightstick', 'ropa', 'otro'] },
  precio:      { type: Number, required: true, min: 0 },
  stock:       { type: Number, required: true, min: 0, default: 0 },
  descripcion: { type: String, trim: true },
  // CAMBIADO: De 'imagen' a 'imagenUrl' para que coincida exactamente con tus rutas y vistas
  imagenUrl:   { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);