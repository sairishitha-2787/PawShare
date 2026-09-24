const express = require("express");
const {
  getProfile,
  updateMe,
  getReviews,
  getAdoptionHistory,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.put("/me", protect, updateMe);
router.get("/:id", getProfile);
router.get("/:id/reviews", getReviews);
router.get("/:id/adoption-history", optionalAuth, getAdoptionHistory);

module.exports = router;
