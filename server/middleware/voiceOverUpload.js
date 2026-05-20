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
  limits: { fileSize: 40 * 1024 * 1024 },
});
