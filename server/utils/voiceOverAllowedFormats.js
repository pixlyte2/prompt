const path = require("path");

/** Lowercase extensions including leading dot */
const ALLOWED_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".wave",
  ".m4a",
  ".aac",
  ".ogg",
  ".oga",
  ".opus",
  ".flac",
  ".webm",
  ".wma",
  ".aiff",
  ".aif",
  ".caf",
]);

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/x-mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/x-aac",
  "audio/ogg",
  "application/ogg",
  "audio/opus",
  "audio/flac",
  "audio/x-flac",
  "audio/webm",
  "audio/x-ms-wma",
  "audio/aiff",
  "audio/x-aiff",
  "audio/x-caf",
]);

const MIME_TO_EXT = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/x-mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/vnd.wave": ".wav",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/x-aac": ".aac",
  "audio/ogg": ".ogg",
  "application/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/flac": ".flac",
  "audio/x-flac": ".flac",
  "audio/webm": ".webm",
  "audio/x-ms-wma": ".wma",
  "audio/aiff": ".aiff",
  "audio/x-aiff": ".aiff",
  "audio/x-caf": ".caf",
};

const CONTENT_TYPE_BY_EXT = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".wave": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/opus",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".wma": "audio/x-ms-wma",
  ".aiff": "audio/aiff",
  ".aif": "audio/aiff",
  ".caf": "audio/x-caf",
};

function extFromOriginalName(originalname) {
  return path.extname(String(originalname || "").toLowerCase());
}

/**
 * @param {{ originalname?: string, mimetype?: string }} file
 */
function isVoiceOverUploadAllowed(file) {
  const ext = extFromOriginalName(file.originalname);
  const mime = String(file.mimetype || "").toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  if (ALLOWED_MIME_TYPES.has(mime)) return true;
  return false;
}

function multerFileFilterMessage() {
  const list = [...ALLOWED_EXTENSIONS].sort().join(", ");
  return `Use a supported audio file (${list}).`;
}

/**
 * Pick extension for stored disk filename (basename only).
 * @param {{ originalname?: string, mimetype?: string }} file
 */
function storageExtensionForVoiceOver(file) {
  const ext = extFromOriginalName(file.originalname);
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  const mime = String(file.mimetype || "").toLowerCase();
  const fromMime = MIME_TO_EXT[mime];
  if (fromMime && ALLOWED_EXTENSIONS.has(fromMime)) return fromMime;
  return ".bin";
}

/**
 * @param {string} storedName
 * @param {string} [originalName]
 */
function contentTypeForVoiceOver(storedName, originalName) {
  const ext1 = path.extname(String(storedName || "").toLowerCase());
  if (CONTENT_TYPE_BY_EXT[ext1]) return CONTENT_TYPE_BY_EXT[ext1];
  const ext2 = path.extname(String(originalName || "").toLowerCase());
  if (CONTENT_TYPE_BY_EXT[ext2]) return CONTENT_TYPE_BY_EXT[ext2];
  return "application/octet-stream";
}

/**
 * @param {string} [storedFilename]
 */
function defaultVoiceOverOriginalName(storedFilename) {
  const ext = path.extname(String(storedFilename || "").toLowerCase());
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return `voice-over${ext}`;
  return "voice-over";
}

module.exports = {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  isVoiceOverUploadAllowed,
  multerFileFilterMessage,
  storageExtensionForVoiceOver,
  contentTypeForVoiceOver,
  defaultVoiceOverOriginalName,
};
