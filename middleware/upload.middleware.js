const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const uploadDirectory = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1000000)}${extension}`);
  },
});

const carImagesUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_request, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

module.exports = { carImagesUpload };
