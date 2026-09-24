const express = require("express");
const {
  createApplication,
  myApplications,
  receivedApplications,
  getApplication,
  decideApplication,
  withdrawApplication,
} = require("../controllers/applicationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Fixed paths must come before "/:id".
router.post("/", authorize("adopter"), createApplication);
router.get("/mine", authorize("adopter"), myApplications);
router.get("/received", authorize("shelter", "admin"), receivedApplications);
router.get("/:id", getApplication);
router.patch("/:id/status", authorize("shelter", "admin"), decideApplication);
router.patch("/:id/withdraw", authorize("adopter"), withdrawApplication);

module.exports = router;
