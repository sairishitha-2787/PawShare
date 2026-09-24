const express = require("express");
const {
  listAnimals,
  nearbyAnimals,
  myAnimals,
  getAnimal,
  createAnimal,
  updateAnimal,
  deleteAnimal,
} = require("../controllers/animalController");
const { protect, authorize, requireVerified } = require("../middleware/auth");

const router = express.Router();

// Fixed paths must come before "/:id".
router.get("/", listAnimals);
router.get("/nearby", nearbyAnimals);
router.get("/mine", protect, authorize("shelter", "admin"), myAnimals);
router.get("/:id", getAnimal);

// New listings need a verified shelter; existing ones stay editable (e.g. to mark adopted).
router.post("/", protect, authorize("shelter", "admin"), requireVerified, createAnimal);
router.put("/:id", protect, authorize("shelter", "admin"), updateAnimal);
router.delete("/:id", protect, authorize("shelter", "admin"), deleteAnimal);

module.exports = router;
