const Application = require("../models/Application");
const Animal = require("../models/Animal");
const CheckIn = require("../models/CheckIn");

// Animals can receive applications while available or while others are pending.
const OPEN_STATUSES = ["available", "pending"];

const ANIMAL_FIELDS = "name species breed photos status listingType location.city";
const APPLICANT_FIELDS = "name email phone location.city location.state";
const SHELTER_FIELDS = "name isVerified rating location.city";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const isShelterFor = (user, application) =>
  user.role === "admin" || application.shelter.equals(user._id);

// Puts an animal back to "available" once it has no pending applications left.
const releaseAnimalIfIdle = async (animalId) => {
  const stillPending = await Application.exists({ animal: animalId, status: "pending" });
  if (!stillPending) {
    await Animal.updateOne({ _id: animalId, status: "pending" }, { status: "available" });
  }
};

// Moves an application out of "pending" atomically, so two requests can't both decide it.
const closePending = (id, update) =>
  Application.findOneAndUpdate(
    { _id: id, status: "pending" },
    { ...update, decidedAt: new Date() },
    { returnDocument: "after", runValidators: true }
  );

// POST /api/applications
const createApplication = async (req, res) => {
  const { animalId, type, message, answers, fosterUntil } = req.body || {};

  if (!animalId || !type) {
    throw httpError(400, "animalId and type are required");
  }
  if (!["adoption", "foster"].includes(type)) {
    throw httpError(400, "type must be adoption or foster");
  }

  const animal = await Animal.findById(animalId);
  if (!animal) throw httpError(404, "Animal not found");

  if (!OPEN_STATUSES.includes(animal.status)) {
    throw httpError(409, "This animal is no longer accepting applications");
  }
  if (animal.listingType !== "both" && animal.listingType !== type) {
    throw httpError(400, `This animal is only listed for ${animal.listingType}`);
  }

  const duplicate = await Application.exists({
    animal: animal._id,
    applicant: req.user._id,
    status: { $in: ["pending", "approved"] },
  });
  if (duplicate) {
    throw httpError(409, "You already have an active application for this animal");
  }

  const application = await Application.create({
    animal: animal._id,
    applicant: req.user._id,
    shelter: animal.owner,
    type,
    message,
    answers,
    fosterUntil: type === "foster" ? fosterUntil : undefined,
  });

  await Animal.updateOne({ _id: animal._id, status: "available" }, { status: "pending" });

  res.status(201).json({ application });
};

// GET /api/applications/mine  (adopter's own applications)
const myApplications = async (req, res) => {
  const filter = { applicant: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .populate("animal", ANIMAL_FIELDS)
    .populate("shelter", SHELTER_FIELDS);

  res.json({ applications });
};

// GET /api/applications/received?status=&animal=  (shelter's incoming applications)
const receivedApplications = async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { shelter: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.animal) filter.animal = String(req.query.animal);

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .populate("animal", ANIMAL_FIELDS)
    .populate("applicant", APPLICANT_FIELDS);

  res.json({ applications });
};

// GET /api/applications/:id  (applicant, the animal's shelter, or admin)
const getApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, "Application not found");

  const isApplicant = application.applicant.equals(req.user._id);
  if (!isApplicant && !isShelterFor(req.user, application)) {
    throw httpError(403, "You cannot view this application");
  }

  await application.populate([
    { path: "animal", select: ANIMAL_FIELDS },
    { path: "applicant", select: APPLICANT_FIELDS },
    { path: "shelter", select: SHELTER_FIELDS },
  ]);

  res.json({ application });
};

// PATCH /api/applications/:id/status  { status: "approved" | "rejected", note }
const decideApplication = async (req, res) => {
  const { status, note } = req.body || {};
  if (!["approved", "rejected"].includes(status)) {
    throw httpError(400, "status must be approved or rejected");
  }

  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, "Application not found");
  if (!isShelterFor(req.user, application)) {
    throw httpError(403, "Only the animal's shelter can decide this application");
  }
  if (application.status !== "pending") {
    throw httpError(409, `Application is already ${application.status}`);
  }

  if (status === "rejected") {
    const updated = await closePending(application._id, { status, shelterNote: note });
    if (!updated) throw httpError(409, "Application was already decided");
    await releaseAnimalIfIdle(application.animal);
    return res.json({ application: updated });
  }

  // Approve: claim the animal first so it can't be given to two people.
  const newAnimalStatus = application.type === "adoption" ? "adopted" : "fostered";
  const animal = await Animal.findOneAndUpdate(
    { _id: application.animal, status: { $in: OPEN_STATUSES } },
    { status: newAnimalStatus },
    { returnDocument: "after" }
  );
  if (!animal) throw httpError(409, "This animal is no longer available");

  const updated = await closePending(application._id, { status, shelterNote: note });
  if (!updated) {
    // Someone withdrew or decided it in the meantime; undo the claim.
    await Animal.updateOne({ _id: animal._id }, { status: "pending" });
    await releaseAnimalIfIdle(animal._id);
    throw httpError(409, "Application was already decided");
  }

  await CheckIn.scheduleFor(updated);

  // Everyone else waiting on this animal is turned down.
  await Application.updateMany(
    { animal: animal._id, status: "pending", _id: { $ne: updated._id } },
    {
      status: "rejected",
      shelterNote: "This animal has found a home with another applicant.",
      decidedAt: new Date(),
    }
  );

  res.json({ application: updated, animal });
};

// PATCH /api/applications/:id/withdraw  (applicant only, while pending)
const withdrawApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, "Application not found");
  if (!application.applicant.equals(req.user._id)) {
    throw httpError(403, "You can only withdraw your own application");
  }

  const updated = await closePending(application._id, { status: "withdrawn" });
  if (!updated) throw httpError(409, `Application is already ${application.status}`);

  await releaseAnimalIfIdle(application.animal);
  res.json({ application: updated });
};

module.exports = {
  createApplication,
  myApplications,
  receivedApplications,
  getApplication,
  decideApplication,
  withdrawApplication,
};
