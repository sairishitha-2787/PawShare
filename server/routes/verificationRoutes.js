const express = require("express");
const { myVerification, requestVerification } = require("../controllers/verificationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("shelter"));

router.get("/me", myVerification);
router.post("/request", requestVerification);

module.exports = router;
