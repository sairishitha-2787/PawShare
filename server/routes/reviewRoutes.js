const express = require("express");
const { createReview, updateReview, deleteReview } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize("adopter"), createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;
