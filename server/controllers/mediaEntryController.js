const MediaEntry    = require("../models/MediaEntry");
const MediaCategory = require("../models/MediaCategory");

/** URL fields that must start with http:// or https:// when non-empty. */
const URL_FIELDS = ["youtube", "facebook", "twitter", "instagram", "website"];
const URL_PATTERN = /^https?:\/\//i;

/**
 * Validates all URL fields on a payload.
 * Returns an error message string, or null if everything is valid.
 */
function validateUrls(body) {
  for (const field of URL_FIELDS) {
    const val = body[field];
    if (val && !URL_PATTERN.test(val)) {
      return `${field} must be a valid URL starting with http:// or https://`;
    }
  }

  const customLinks = body.customLinks;
  if (Array.isArray(customLinks)) {
    for (let i = 0; i < customLinks.length; i++) {
      const link = customLinks[i];
      if (!link.label || !link.label.trim()) {
        return `customLinks[${i}].label is required`;
      }
      if (!link.url || !link.url.trim()) {
        return `customLinks[${i}].url is required`;
      }
      if (!URL_PATTERN.test(link.url)) {
        return `customLinks[${i}].url must be a valid URL starting with http:// or https://`;
      }
    }
  }

  return null;
}

/**
 * GET /api/media-entries
 * Returns entries for the company. Optionally filtered by ?categoryId=xxx.
 */
const getEntries = async (req, res) => {
  try {
    const filter = { companyId: req.user.companyId };

    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const entries = await MediaEntry.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json(entries);
  } catch (err) {
    console.error("getEntries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/media-entries
 * Creates a new media entry. Validates name, categoryId ownership, and URLs.
 */
const createEntry = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      youtube,
      facebook,
      twitter,
      instagram,
      website,
      customLinks,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    // Verify category belongs to this company
    const category = await MediaCategory.findOne({
      _id:       categoryId,
      companyId: req.user.companyId,
    });

    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    const urlError = validateUrls(req.body);
    if (urlError) {
      return res.status(400).json({ message: urlError });
    }

    // Assign sortOrder = max existing order in same category + 1
    const last = await MediaEntry.findOne({
      companyId: req.user.companyId,
      categoryId,
    }).sort({ sortOrder: -1 });
    const nextOrder = last ? (last.sortOrder || 0) + 1 : 0;

    const entry = await MediaEntry.create({
      companyId:   req.user.companyId,
      createdBy:   req.user._id,
      categoryId,
      name:        name.trim(),
      description: description ? description.trim() : "",
      youtube:     youtube    || "",
      facebook:    facebook   || "",
      twitter:     twitter    || "",
      instagram:   instagram  || "",
      website:     website    || "",
      customLinks: Array.isArray(customLinks) ? customLinks : [],
      sortOrder:   nextOrder,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("createEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/media-entries/:id
 * Updates a media entry owned by the company. Validates all URL fields.
 */
const updateEntry = async (req, res) => {
  try {
    const entry = await MediaEntry.findOne({
      _id:       req.params.id,
      companyId: req.user.companyId,
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const {
      name,
      description,
      categoryId,
      youtube,
      facebook,
      twitter,
      instagram,
      website,
      customLinks,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      entry.name = name.trim();
    }

    if (description !== undefined) {
      entry.description = description.trim();
    }

    if (categoryId !== undefined) {
      // Verify new category also belongs to this company
      const category = await MediaCategory.findOne({
        _id:       categoryId,
        companyId: req.user.companyId,
      });
      if (!category) {
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      entry.categoryId = categoryId;
    }

    const urlError = validateUrls(req.body);
    if (urlError) {
      return res.status(400).json({ message: urlError });
    }

    if (youtube   !== undefined) entry.youtube   = youtube;
    if (facebook  !== undefined) entry.facebook  = facebook;
    if (twitter   !== undefined) entry.twitter   = twitter;
    if (instagram !== undefined) entry.instagram = instagram;
    if (website   !== undefined) entry.website   = website;

    if (Array.isArray(customLinks)) {
      entry.customLinks = customLinks;
    }

    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error("updateEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/media-entries/:id/reorder
 * Updates sortOrder for a single entry. Client sends the full reordered list
 * of IDs for the same category so all siblings are updated atomically.
 * Body: { orderedIds: string[] }  — full ordered list of IDs within the category
 */
const reorderEntries = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "orderedIds array is required" });
    }

    // Bulk-update sortOrder for each ID — only process IDs that belong to this company
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, companyId: req.user.companyId },
        update: { $set: { sortOrder: index } },
      },
    }));

    await MediaEntry.bulkWrite(bulkOps);
    res.json({ message: "Order updated" });
  } catch (err) {
    console.error("reorderEntries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/media-entries/:id
 * Deletes a single media entry owned by the company.
 */
const deleteEntry = async (req, res) => {
  try {
    const entry = await MediaEntry.findOne({
      _id:       req.params.id,
      companyId: req.user.companyId,
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    await entry.deleteOne();
    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("deleteEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getEntries,
  createEntry,
  updateEntry,
  reorderEntries,
  deleteEntry,
};
