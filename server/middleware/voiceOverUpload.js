const multer = require("multer");
const {
  isVoiceOverUploadAllowed,
  multerFileFilterMessage,
} = require("../utils/voiceOverAllowedFormats");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (isVoiceOverUploadAllowed(file)) return cb(null, true);
  cb(new Error(multerFileFilterMessage()));
}

module.exports = multer({
  storage,
  fileFilter,
  // Vercel serverless request body hard cap is 4.5 MB — keep in sync with client VOICE_OVER_MAX_BYTES
  limits: { fileSize: 4 * 1024 * 1024 },
});
