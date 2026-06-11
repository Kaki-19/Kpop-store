const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  items: [{
    producto: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Producto', 
      required: true 
    },
    cantidad:       { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true }
  }],
  total:     { type: Number, required: true },
  estado:    { type: String, enum: ['pendiente', 'enviado', 'entregado', 'cancelado'], default: 'pendiente' },
  direccion: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);