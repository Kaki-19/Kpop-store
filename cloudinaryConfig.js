const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configura Cloudinary jalando los datos de tu .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración para procesar la foto temporalmente en la memoria del servidor
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Función mágica que toma la foto y la sube a tu cuenta de Cloudinary
const subirACloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mi_tienda_productos' }, // Las fotos se guardarán en esta carpeta dentro de tu Cloudinary
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { upload, subirACloudinary };