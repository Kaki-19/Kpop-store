require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error:', err));

// Configuración
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
// Añade esto en app.js debajo de tus otros app.use
app.get('/envio', (req, res) => {
    // Si necesitas autenticación, añade aquí el middleware 'auth'
    res.render('envio', { usuario: req.session.usuarioNombre });
});
// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/* ==========================================================================
   ✨ MIDDLEWARE GLOBAL: Compartir sesión con las vistas EJS
   ========================================================================== */
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* ==========================================================================
   ✨ MIDDLEWARE DE SOCKET.IO: Inyectar 'io' en las peticiones (req)
   ========================================================================== */
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuración básica de escucha de conexiones WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Un cliente se ha conectado vía WebSockets');
  
  socket.on('disconnect', () => {
    console.log('❌ Un cliente se ha desconectado');
  });
});

/* ==========================================================================
   🛣️ ENRUTADORES
   ========================================================================== */
app.use('/auth', require('./routes/auth'));
app.use('/productos', require('./routes/productos'));
app.use('/pedidos', require('./routes/pedidos'));

// Registro blindado para el enrutador del carrito
const carritoRouter = require('./routes/Carrito');
app.use('/carrito', carritoRouter);
app.use('/Carrito', carritoRouter); // Resguardo en caso de conflictos de mayúsculas en el cliente

app.get('/', (req, res) => res.redirect('/productos'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));