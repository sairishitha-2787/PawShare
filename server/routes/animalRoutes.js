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
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Fixed paths must come before "/:id".
router.get("/", listAnimals);
router.get("/nearby", nearbyAnimals);
router.get("/mine", protect, authorize("shelter", "admin"), myAnimals);
router.get("/:id", getAnimal);

router.post("/", protect, authorize("shelter", "admin"), createAnimal);
router.put("/:id", protect, authorize("shelter", "admin"), updateAnimal);
router.delete("/:id", protect, authorize("shelter", "admin"), deleteAnimal);

module.exports = router;
