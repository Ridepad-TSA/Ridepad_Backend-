
const multer = require('multer');
const { AppError } = require('../Utils/appError');

const storage = multer.memoryStorage();

const carImagesUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new AppError(400, 'Only image files are allowed'));
    }

    callback(null, true);
  }
});

module.exports = { carImagesUpload };
