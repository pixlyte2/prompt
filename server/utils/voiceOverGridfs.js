const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

const BUCKET_NAME = "voiceOver";

function getDb() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB is not connected");
  }
  return db;
}

function getBucket() {
  return new GridFSBucket(getDb(), { bucketName: BUCKET_NAME });
}

/** Strict 24-char hex — GridFS file id we store on VideoTask.voiceOverStoredName */
function isVoiceOverGridFsId(stored) {
  return typeof stored === "string" && /^[a-fA-F0-9]{24}$/.test(stored.trim());
}

/**
 * @param {string | null | undefined} storedName
 */
async function deleteVoiceOverGridFs(storedName) {
  if (!isVoiceOverGridFsId(storedName)) return;
  try {
    await getBucket().delete(new ObjectId(String(storedName).trim()));
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (/not found|doesn't exist|ENOENT/i.test(msg)) return;
    console.warn("deleteVoiceOverGridFs:", msg);
  }
}

/**
 * @param {Buffer} buffer
 * @param {{ originalName?: string, contentType?: string, taskMongoId: import("mongoose").Types.ObjectId }} opts
 * @returns {Promise<import("mongodb").ObjectId>}
 */
function uploadVoiceOverBuffer(buffer, opts) {
  const bucket = getBucket();
  const filename = String(opts.originalName || "voice-over").replace(/[/\\]/g, "_").slice(0, 200) || "voice-over";
  const contentType = String(opts.contentType || "application/octet-stream");
  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata: {
      taskId: opts.taskMongoId,
      contentType,
    },
  });
  return new Promise((resolve, reject) => {
    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

/**
 * @param {string} storedName
 * @returns {Promise<import("mongodb").GridFSFile | null>}
 */
async function findVoiceOverFile(storedName) {
  if (!isVoiceOverGridFsId(storedName)) return null;
  const files = await getBucket()
    .find({ _id: new ObjectId(storedName.trim()) })
    .limit(1)
    .toArray();
  return files[0] || null;
}

module.exports = {
  BUCKET_NAME,
  isVoiceOverGridFsId,
  getBucket,
  deleteVoiceOverGridFs,
  uploadVoiceOverBuffer,
  findVoiceOverFile,
  ObjectId,
};
