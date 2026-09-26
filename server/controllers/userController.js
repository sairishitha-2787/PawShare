const User = require("../models/User");
const Animal = require("../models/Animal");
const Application = require("../models/Application");
const Review = require("../models/Review");
const sanitizeUser = require("../utils/sanitizeUser");

const httpError = (status, message) => Object.assign(new Error(message), { status });

const ANIMAL_FIELDS = "name species breed photos";

const loadUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw httpError(404, "User not found");
  return user;
};

// GET /api/users/:id  — public profile (no email/phone), with shelter stats.
// Shelters also show the about text and website from their verification request (never the
// registration number, document or admin note).
const getProfile = async (req, res) => {
  const user = await loadUser(req.params.id);

  const profile = {
    id: user._id,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified,
    rating: user.rating,
    ratingCount: user.ratingCount,
    location: { city: user.location?.city, state: user.location?.state },
    memberSince: user.createdAt,
  };

  if (user.role === "shelter") {
    const [availableCount, placedCount] = await Promise.all([
      Animal.countDocuments({ owner: user._id, status: { $in: ["available", "pending"] } }),
      Application.countDocuments({ shelter: user._id, status: "approved" }),
    ]);
    profile.stats = { availableCount, placedCount };
    profile.about = user.verification?.about || "";
    profile.website = user.verification?.website || "";
  }

  res.json({ profile });
};

// PUT /api/users/me  { name, phone, location }
const updateMe = async (req, res) => {
  const { name, phone, location } = req.body || {};
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (location !== undefined) req.user.location = location;

  await req.user.save();
  res.json({ user: sanitizeUser(req.user) });
};

// GET /api/users/:id/reviews?page=&limit=  — public
const getReviews = async (req, res) => {
  const user = await loadUser(req.params.id);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const [reviews, total] = await Promise.all([
    Review.find({ shelter: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reviewer", "name"),
    Review.countDocuments({ shelter: user._id }),
  ]);

  res.json({
    reviews,
    rating: user.rating,
    ratingCount: user.ratingCount,
    page,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

// GET /api/users/:id/adoption-history
// Shelters: public list of animals they placed (adopter not shown).
// Adopters: their own adoptions/fosters — visible only to themselves or an admin.
const getAdoptionHistory = async (req, res) => {
  const user = await loadUser(req.params.id);

  if (user.role === "shelter") {
    const placed = await Application.find({ shelter: user._id, status: "approved" })
      .sort({ decidedAt: -1 })
      .select("animal type decidedAt")
      .populate("animal", ANIMAL_FIELDS);
    return res.json({ history: placed });
  }

  const isSelf = req.user && req.user._id.equals(user._id);
  if (!isSelf && req.user?.role !== "admin") {
    throw httpError(403, "Adoption history is private");
  }

  const [adopted, reviewed] = await Promise.all([
    Application.find({ applicant: user._id, status: "approved" })
      .sort({ decidedAt: -1 })
      .select("animal shelter type decidedAt")
      .populate("animal", ANIMAL_FIELDS)
      .populate("shelter", "name isVerified"),
    Review.find({ reviewer: user._id }).select("application"),
  ]);

  // Lets the frontend show "Leave a review" only where there isn't one yet.
  const reviewedIds = new Set(reviewed.map((r) => String(r.application)));
  const history = adopted.map((a) => ({ ...a.toJSON(), reviewed: reviewedIds.has(String(a._id)) }));

  res.json({ history });
};

module.exports = { getProfile, updateMe, getReviews, getAdoptionHistory };
