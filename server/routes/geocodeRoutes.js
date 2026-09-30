const express = require("express");
const router = express.Router();
const { geocodeAddress } = require("../services/geocoding");

// GET /api/geocode?address=Bengaluru
router.get("/", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: "address query parameter is required" });
    }
    const result = await geocodeAddress(address);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;