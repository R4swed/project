import multer from 'multer';
import path from 'path';

// Настройка хранилища для файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Папка для загруженных файлов
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат файла'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 МБ
  },
  fileFilter: fileFilter
});