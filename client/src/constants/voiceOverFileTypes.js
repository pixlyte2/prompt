/**
 * Keep in sync with server/utils/voiceOverAllowedFormats.js (extensions + validation rules).
 */

const VOICE_OVER_EXTENSIONS = new Set([
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

const VOICE_OVER_MIME_TYPES = new Set([
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

/** File input `accept` — includes `audio/*` for OS pickers; uploads are validated against the allowlist. */
export const VOICE_OVER_ACCEPT = `${[...VOICE_OVER_EXTENSIONS].join(",")},${[...VOICE_OVER_MIME_TYPES].join(",")},audio/*`;

/**
 * @param {File | null | undefined} file
 */
export function isVoiceOverFileAllowed(file) {
  if (!file || !file.name) return false;
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (VOICE_OVER_EXTENSIONS.has(ext)) return true;
  const mime = String(file.type || "").toLowerCase();
  if (VOICE_OVER_MIME_TYPES.has(mime)) return true;
  return false;
}

export function voiceOverFileTypeHint() {
  return "MP3, WAV, M4A, AAC, OGG, Opus, FLAC, WebM (audio), WMA, AIFF, CAF";
}
