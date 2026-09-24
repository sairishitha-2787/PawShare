const CheckIn = require("../models/CheckIn");
const Application = require("../models/Application");
const Animal = require("../models/Animal");

const DAY_MS = 24 * 60 * 60 * 1000;
const ANIMAL_FIELDS = "name species breed photos status";
const USER_FIELDS = "name email phone";

const httpError = (status, message) => Object.assign(new Error(message), { status });

// ?status=pending|completed|overdue  and  ?dueWithin=<days> (pending ones due in that window, incl. overdue)
const statusFilter = (query) => {
  const filter = {};
  const status = query.status ? String(query.status) : undefined;

  if (status === "overdue") {
    filter.status = "pending";
    filter.dueDate = { $lt: new Date() };
  } else if (status) {
    if (!["pending", "completed"].includes(status)) {
      throw httpError(400, "status must be pending, completed or overdue");
    }
    filter.status = status;
  }

  if (query.dueWithin !== undefined) {
    const days = Number(query.dueWithin);
    if (!Number.isFinite(days) || days < 0) throw httpError(400, "dueWithin must be a number of days");
    filter.status = "pending";
    filter.dueDate = { $lte: new Date(Date.now() + days * DAY_MS) };
  }

  return filter;
};

// Pending first by due date, then completed newest first.
const sortCheckIns = (list) =>
  list.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    if (a.status === "pending") return (a.dueDate || 0) - (b.dueDate || 0);
    return (b.completedAt || 0) - (a.completedAt || 0);
  });

// GET /api/checkins/mine  (adopter)
const myCheckIns = async (req, res) => {
  const checkIns = await CheckIn.find({ adopter: req.user._id, ...statusFilter(req.query) })
    .populate("animal", ANIMAL_FIELDS)
    .populate("shelter", "name");
  res.json({ checkIns: sortCheckIns(checkIns) });
};

// GET /api/checkins/received  (shelter: check-ins for its animals)
const receivedCheckIns = async (req, res) => {
  const filter = { ...statusFilter(req.query) };
  if (req.user.role !== "admin") filter.shelter = req.user._id;
  if (req.query.animal) filter.animal = String(req.query.animal);

  const checkIns = await CheckIn.find(filter)
    .populate("animal", ANIMAL_FIELDS)
    .populate("adopter", USER_FIELDS);
  res.json({ checkIns: sortCheckIns(checkIns) });
};

// GET /api/checkins/animal/:animalId  (full history: the adopter, the shelter, or admin)
const animalHistory = async (req, res) => {
  const animal = await Animal.findById(req.params.animalId);
  if (!animal) throw httpError(404, "Animal not found");

  const filter = { animal: animal._id };
  const isShelter = animal.owner.equals(req.user._id) || req.user.role === "admin";
  if (!isShelter) filter.adopter = req.user._id; // adopters only see their own entries

  const checkIns = await CheckIn.find(filter).populate("adopter", "name");
  if (!isShelter && checkIns.length === 0) {
    throw httpError(403, "You have no check-ins for this animal");
  }

  res.json({ checkIns: sortCheckIns(checkIns) });
};

// POST /api/checkins/:id/complete  { condition, weightKg, eatingWell, vetVisit, notes, photos }
const completeCheckIn = async (req, res) => {
  const checkIn = await CheckIn.findById(req.params.id);
  if (!checkIn) throw httpError(404, "Check-in not found");
  if (!checkIn.adopter.equals(req.user._id)) {
    throw httpError(403, "Only the adopter can complete this check-in");
  }
  if (checkIn.status === "completed") throw httpError(409, "Check-in is already completed");

  checkIn.healthUpdate = req.body || {};
  checkIn.status = "completed";
  checkIn.completedAt = new Date();
  await checkIn.save();

  res.json({ checkIn });
};

// POST /api/checkins  { animalId, ...healthUpdate }  — log a health update any time
const logHealthUpdate = async (req, res) => {
  const { animalId, ...healthUpdate } = req.body || {};
  if (!animalId) throw httpError(400, "animalId is required");

  const application = await Application.findOne({
    animal: animalId,
    applicant: req.user._id,
    status: "approved",
  });
  if (!application) {
    throw httpError(403, "You can only log updates for an animal you adopted or are fostering");
  }

  const checkIn = await CheckIn.create({
    application: application._id,
    animal: application.animal,
    adopter: application.applicant,
    shelter: application.shelter,
    kind: "adhoc",
    label: "Health update",
    status: "completed",
    completedAt: new Date(),
    healthUpdate,
  });

  res.status(201).json({ checkIn });
};

module.exports = {
  myCheckIns,
  receivedCheckIns,
  animalHistory,
  completeCheckIn,
  logHealthUpdate,
};
