const express = require("express");
const { listShelters, decideVerification } = require("../controllers/verificationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/shelters", listShelters);
router.patch("/shelters/:id/verification", decideVerification);

module.exports = router;
