const User = require("../models/User");

const httpError = (status, message) => Object.assign(new Error(message), { status });

const SHELTER_FIELDS = "name email phone location isVerified verification createdAt";

// GET /api/verification/me  (shelter: its own verification status)
const myVerification = async (req, res) => {
  res.json({ isVerified: req.user.isVerified, verification: req.user.verification });
};

// POST /api/verification/request  { registrationNumber, about, website?, documentUrl? }
const requestVerification = async (req, res) => {
  const { registrationNumber, about, website, documentUrl } = req.body || {};
  const current = req.user.verification?.status;

  if (current === "approved") throw httpError(409, "Your shelter is already verified");
  if (current === "pending") throw httpError(409, "Your request is already being reviewed");
  if (!registrationNumber || !about) {
    throw httpError(400, "registrationNumber and about are required");
  }

  req.user.verification = {
    status: "pending",
    registrationNumber,
    about,
    website,
    documentUrl,
    submittedAt: new Date(),
  };
  await req.user.save();

  res.status(201).json({ verification: req.user.verification });
};

// GET /api/admin/shelters?status=pending  (admin)
const listShelters = async (req, res) => {
  const filter = { role: "shelter" };
  if (req.query.status) filter["verification.status"] = String(req.query.status);

  const shelters = await User.find(filter)
    .select(SHELTER_FIELDS)
    .sort({ "verification.submittedAt": 1, createdAt: 1 });

  res.json({ shelters });
};

// PATCH /api/admin/shelters/:id/verification  { decision: "approve" | "reject", note }
// Rejecting an approved shelter revokes its verification.
const decideVerification = async (req, res) => {
  const { decision, note } = req.body || {};
  if (!["approve", "reject"].includes(decision)) {
    throw httpError(400, "decision must be approve or reject");
  }

  const shelter = await User.findById(req.params.id);
  if (!shelter || shelter.role !== "shelter") throw httpError(404, "Shelter not found");

  const approved = decision === "approve";
  shelter.isVerified = approved;
  shelter.verification.status = approved ? "approved" : "rejected";
  shelter.verification.reviewedAt = new Date();
  shelter.verification.reviewedBy = req.user._id;
  shelter.verification.note = note;
  await shelter.save();

  res.json({
    shelter: await User.findById(shelter._id).select(SHELTER_FIELDS),
  });
};

module.exports = { myVerification, requestVerification, listShelters, decideVerification };
