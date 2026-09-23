const multer = require("multer");

const THUMBNAIL_MAX_BYTES = 25 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: THUMBNAIL_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return callback(new Error("Thumbnail must be a JPEG, PNG, or WebP image"));
    }
    callback(null, true);
  },
});

module.exports = { thumbnailUpload, THUMBNAIL_MAX_BYTES };
