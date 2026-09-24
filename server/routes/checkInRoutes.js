const express = require("express");
const {
  myCheckIns,
  receivedCheckIns,
  animalHistory,
  completeCheckIn,
  logHealthUpdate,
} = require("../controllers/checkInController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/mine", authorize("adopter"), myCheckIns);
router.get("/received", authorize("shelter", "admin"), receivedCheckIns);
router.get("/animal/:animalId", animalHistory);
router.post("/", authorize("adopter"), logHealthUpdate);
router.post("/:id/complete", authorize("adopter"), completeCheckIn);

module.exports = router;
