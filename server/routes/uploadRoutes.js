const express = require("express");
const router = express.Router();
const { uploadImage } = require("../services/cloudinaryUpload");

// POST /api/upload  { "image": "<url or base64 string>" }
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "image field is required" });
    }
    const result = await uploadImage(image);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;