const MediaCategory = require("../models/MediaCategory");
const MediaEntry    = require("../models/MediaEntry");

/**
 * GET /api/media-categories
 * Returns all categories for the requesting user's company.
 */
const getCategories = async (req, res) => {
  try {
    const categories = await MediaCategory.find({
      companyId: req.user.companyId,
    }).sort({ createdAt: 1 });

    res.json(categories);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/media-categories
 * Creates a new category scoped to the requesting user's company.
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await MediaCategory.create({
      companyId:   req.user.companyId,
      createdBy:   req.user._id,
      name:        name.trim(),
      description: description ? description.trim() : "",
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/media-categories/:id
 * Updates name and/or description of a category owned by the company.
 */
const updateCategory = async (req, res) => {
  try {
    const category = await MediaCategory.findOne({
      _id:       req.params.id,
      companyId: req.user.companyId,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, description } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/media-categories/:id
 * Deletes a category and cascades to all MediaEntry documents in that category.
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await MediaCategory.findOne({
      _id:       req.params.id,
      companyId: req.user.companyId,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Cascade: remove all entries belonging to this category within the same company
    await MediaEntry.deleteMany({
      categoryId: category._id,
      companyId:  req.user.companyId,
    });

    await category.deleteOne();

    res.json({ message: "Category and its entries deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
