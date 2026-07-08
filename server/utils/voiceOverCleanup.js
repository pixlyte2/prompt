const VideoTask = require("../models/VideoTask");
const { deleteVoiceOverGridFs } = require("./voiceOverGridfs");

/** Fields cleared when a voice-over expires or is removed. */
const VOICE_OVER_CLEAR = {
  voiceOverStoredName: "",
  voiceOverOriginalName: "",
  voiceOverUploadedAt: null,
  voiceOverExpireAt: null,
};

function isVoiceOverExpired(task, now = Date.now()) {
  if (!task?.voiceOverExpireAt) return false;
  const exp = new Date(task.voiceOverExpireAt).getTime();
  return !Number.isNaN(exp) && exp <= now;
}

function hasVoiceOverFile(task) {
  return Boolean(String(task?.voiceOverStoredName ?? "").trim());
}

/**
 * Remove GridFS blob and clear voice-over fields on a task document.
 * @param {import("mongoose").Document} task
 */
async function clearVoiceOverFromTask(task) {
  if (!task) return;
  await deleteVoiceOverGridFs(task.voiceOverStoredName);
  task.voiceOverStoredName = VOICE_OVER_CLEAR.voiceOverStoredName;
  task.voiceOverOriginalName = VOICE_OVER_CLEAR.voiceOverOriginalName;
  task.voiceOverUploadedAt = VOICE_OVER_CLEAR.voiceOverUploadedAt;
  task.voiceOverExpireAt = VOICE_OVER_CLEAR.voiceOverExpireAt;
  await task.save();
}

/**
 * Delete expired voice-overs: GridFS file + VideoTask voice-over fields.
 * @returns {Promise<number>} number of tasks purged
 */
async function purgeExpiredVoiceOvers() {
  const now = new Date();
  const expired = await VideoTask.find({
    voiceOverStoredName: { $exists: true, $nin: ["", null] },
    voiceOverExpireAt: { $lte: now },
  });

  let purged = 0;
  for (const task of expired) {
    try {
      await clearVoiceOverFromTask(task);
      purged += 1;
    } catch (err) {
      console.warn("purgeExpiredVoiceOvers task", task._id, err?.message || err);
    }
  }

  if (purged > 0) {
    console.log(`🗑️ Voice-over retention: purged ${purged} expired file(s)`);
  }
  return purged;
}

/** Local dev / long-running server: periodic purge (Vercel uses cron route instead). */
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
let cleanupTimer = null;

function scheduleVoiceOverCleanup() {
  if (cleanupTimer || process.env.NODE_ENV === "production") return;
  cleanupTimer = setInterval(() => {
    purgeExpiredVoiceOvers().catch((err) => {
      console.warn("scheduled voice-over purge failed:", err?.message || err);
    });
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();
}

module.exports = {
  VOICE_OVER_CLEAR,
  isVoiceOverExpired,
  hasVoiceOverFile,
  clearVoiceOverFromTask,
  purgeExpiredVoiceOvers,
  scheduleVoiceOverCleanup,
};
