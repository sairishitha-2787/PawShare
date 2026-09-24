const Animal = require("../models/Animal");

// Fields a lister may set. owner is always taken from the logged-in user.
const EDITABLE_FIELDS = [
  "name", "species", "breed", "ageMonths", "gender", "size", "color", "description",
  "photos", "healthRecords", "vaccinated", "neutered", "temperament",
  "listingType", "status", "location",
];

const OWNER_FIELDS = "name role isVerified rating location.city location.state";

const pick = (obj, keys) =>
  keys.reduce((out, key) => {
    if (obj[key] !== undefined) out[key] = obj[key];
    return out;
  }, {});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const csv = (value) =>
  String(value)
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const toNumber = (value) => {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Builds the Mongo filter shared by the search and nearby endpoints.
const buildFilter = (query) => {
  // Only show available animals unless a status is asked for explicitly.
  const filter = { status: query.status ? { $in: csv(query.status) } : "available" };

  if (query.species) filter.species = { $in: csv(query.species) };
  if (query.size) filter.size = { $in: csv(query.size) };
  if (query.gender) filter.gender = { $in: csv(query.gender) };
  if (query.ageGroup) filter.ageGroup = { $in: csv(query.ageGroup) };
  if (query.breed) filter.breed = new RegExp(escapeRegex(String(query.breed)), "i");
  if (query.city) filter["location.city"] = new RegExp(`^${escapeRegex(String(query.city))}$`, "i");
  if (query.temperament) filter.temperament = { $all: csv(query.temperament) };

  if (query.listingType) {
    // "both" listings match either adoption or foster searches.
    filter.listingType = { $in: [String(query.listingType), "both"] };
  }

  const minAge = toNumber(query.minAge);
  const maxAge = toNumber(query.maxAge);
  if (Number.isNaN(minAge) || Number.isNaN(maxAge)) {
    throw badRequest("minAge and maxAge must be numbers (months)");
  }
  if (minAge !== undefined || maxAge !== undefined) {
    filter.ageMonths = {};
    if (minAge !== undefined) filter.ageMonths.$gte = minAge;
    if (maxAge !== undefined) filter.ageMonths.$lte = maxAge;
  }

  if (query.q) filter.$text = { $search: String(query.q) };

  return filter;
};

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  youngest: { ageMonths: 1 },
  eldest: { ageMonths: -1 },
};

// GET /api/animals
const listAnimals = async (req, res) => {
  const filter = buildFilter(req.query);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [animals, total] = await Promise.all([
    Animal.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("owner", OWNER_FIELDS),
    Animal.countDocuments(filter),
  ]);

  res.json({ animals, page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/animals/nearby?lng=..&lat=..&radius=km  (sorted nearest first)
const nearbyAnimals = async (req, res) => {
  const lng = toNumber(req.query.lng);
  const lat = toNumber(req.query.lat);
  const radiusKm = toNumber(req.query.radius) ?? 25;

  const valid =
    Number.isFinite(lng) && Number.isFinite(lat) && Number.isFinite(radiusKm) &&
    lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90 && radiusKm > 0;
  if (!valid) {
    throw badRequest("lng, lat (valid coordinates) and a positive radius in km are required");
  }

  const filter = buildFilter(req.query);
  filter["location.coordinates"] = {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: radiusKm * 1000,
    },
  };

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const animals = await Animal.find(filter).limit(limit).populate("owner", OWNER_FIELDS);

  res.json({ animals, count: animals.length });
};

// GET /api/animals/mine
const myAnimals = async (req, res) => {
  const animals = await Animal.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ animals });
};

// GET /api/animals/:id
const getAnimal = async (req, res) => {
  const animal = await Animal.findById(req.params.id).populate("owner", OWNER_FIELDS);
  if (!animal) return res.status(404).json({ message: "Animal not found" });
  res.json({ animal });
};

// POST /api/animals
const createAnimal = async (req, res) => {
  const data = pick(req.body || {}, EDITABLE_FIELDS);
  const animal = await Animal.create({ ...data, owner: req.user._id });
  res.status(201).json({ animal });
};

// Loads the animal and checks the caller owns it (or is admin); sends the error itself.
const loadOwnedAnimal = async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    res.status(404).json({ message: "Animal not found" });
    return null;
  }
  if (!animal.owner.equals(req.user._id) && req.user.role !== "admin") {
    res.status(403).json({ message: "You can only change your own listings" });
    return null;
  }
  return animal;
};

// PUT /api/animals/:id
const updateAnimal = async (req, res) => {
  const animal = await loadOwnedAnimal(req, res);
  if (!animal) return;

  animal.set(pick(req.body || {}, EDITABLE_FIELDS));
  await animal.save();
  res.json({ animal });
};

// DELETE /api/animals/:id
const deleteAnimal = async (req, res) => {
  const animal = await loadOwnedAnimal(req, res);
  if (!animal) return;

  await animal.deleteOne();
  res.json({ message: "Animal deleted" });
};

module.exports = {
  listAnimals,
  nearbyAnimals,
  myAnimals,
  getAnimal,
  createAnimal,
  updateAnimal,
  deleteAnimal,
};
