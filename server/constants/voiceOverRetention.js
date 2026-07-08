/** Voice-over files are retained for 10 days, then auto-deleted from GridFS and cleared on VideoTask. */
const VOICE_OVER_RETENTION_DAYS = 10;
const VOICE_OVER_RETENTION_MS = VOICE_OVER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const VOICE_OVER_RETENTION_SECONDS = VOICE_OVER_RETENTION_DAYS * 24 * 60 * 60;

function voiceOverExpireAtFrom(uploadedAt = new Date()) {
  return new Date(new Date(uploadedAt).getTime() + VOICE_OVER_RETENTION_MS);
}

module.exports = {
  VOICE_OVER_RETENTION_DAYS,
  VOICE_OVER_RETENTION_MS,
  VOICE_OVER_RETENTION_SECONDS,
  voiceOverExpireAtFrom,
};
