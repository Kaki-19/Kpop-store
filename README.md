🌸 KPop Store

Tema: Tienda de comercio electrónico especializada en mercancía oficial de K-Pop.
Descripción: KPop Store es una plataforma web completa que permite a los usuarios explorar un catálogo diverso de productos (álbumes, photocards, lightsticks y ropa). Incluye un sistema de autenticación de usuarios, un dashboard administrativo para el seguimiento de pedidos y corte de caja, además de una integración profesional con Cloudinary para la gestión de imágenes.

Entidades y Relación
El sistema se estructura mediante tres entidades fundamentales para garantizar la integridad y escalabilidad de los datos:

Usuario: Gestiona los perfiles de clientes y administradores, facilitando el control de acceso.

Producto: Contiene toda la información del catálogo (nombre, artista, categoría, precio, stock, descripción e imagen).

Pedido: Registra las transacciones, vinculando al usuario con los items comprados.

Relación: Referencia 
Hemos implementado una relación de referencia en lugar de embebido. Esto es crucial porque:

Los productos tienen un ciclo de vida independiente de los pedidos.

Al registrar el precioUnitario en el pedido, garantizamos que los datos históricos de venta se mantengan inalterables incluso si el precio del producto cambia en el catálogo.

Evitamos la redundancia excesiva de datos, optimizando el rendimiento de la base de datos.

Configuración Técnica
MongoDB: Versión 8.0.24 

Cómo ejecutar el proyecto
Instala las dependencias:

Bash
npm install
Configura tus variables de entorno:
Crea un archivo .env en la raíz con las siguientes credenciales:

Fragmento de código
MONGODB_URI=tu_cadena_de_conexion_de_mongodb
SESSION_SECRET=tu_secreto
PORT=3000
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
Ejecuta el seed:
Este paso creará el usuario demo y cargará los productos iniciales:

Bash
node seed.js
Inicia el servidor:

Bash
node app.js
Demo y Acceso
URL desplegada: https://kpop-store.onrender.com

Usuario demo: demo@demo.com / Demo1234
