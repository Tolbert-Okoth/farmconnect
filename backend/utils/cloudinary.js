const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Keep the upload in memory (max 5 MB), check it, then stream it to Cloudinary.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Only JPEG, PNG or WebP images are allowed');
    err.statusCode = 400;
    cb(err);
  },
});

const pushToCloudinary = (req, res, next) => {
  if (!req.file) return next();
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'farmconnect_produce', format: 'jpg', resource_type: 'image' },
    (err, result) => {
      if (err) return next(err);
      // Same fields the old multer-storage-cloudinary set, so controllers are unchanged
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    }
  );
  stream.end(req.file.buffer);
};

// Drop-in replacement for upload.single(field): returns [parse, upload] middleware
const upload = {
  single: (field) => [memoryUpload.single(field), pushToCloudinary],
};

module.exports = { upload, cloudinary };
