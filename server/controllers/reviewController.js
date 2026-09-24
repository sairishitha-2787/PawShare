const Review = require("../models/Review");
const Application = require("../models/Application");

const httpError = (status, message) => Object.assign(new Error(message), { status });

// POST /api/reviews  { applicationId, rating, comment }
const createReview = async (req, res) => {
  const { applicationId, rating, comment } = req.body || {};
  if (!applicationId) throw httpError(400, "applicationId is required");

  const application = await Application.findById(applicationId);
  if (!application) throw httpError(404, "Application not found");
  if (!application.applicant.equals(req.user._id)) {
    throw httpError(403, "You can only review your own adoptions");
  }
  if (application.status !== "approved") {
    throw httpError(400, "You can only review a shelter after an approved adoption or foster");
  }
  if (await Review.exists({ application: application._id })) {
    throw httpError(409, "You have already reviewed this adoption");
  }

  const review = await Review.create({
    shelter: application.shelter,
    reviewer: req.user._id,
    application: application._id,
    rating,
    comment,
  });
  await Review.refreshShelterRating(review.shelter);

  res.status(201).json({ review });
};

// Admins may remove reviews (moderation) but never rewrite someone else's rating.
const loadOwnReview = async (req, { allowAdmin = false } = {}) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found");
  const isAdmin = allowAdmin && req.user.role === "admin";
  if (!review.reviewer.equals(req.user._id) && !isAdmin) {
    throw httpError(403, "You can only change your own review");
  }
  return review;
};

// PUT /api/reviews/:id  { rating?, comment? }  (reviewer only)
const updateReview = async (req, res) => {
  const review = await loadOwnReview(req);
  const { rating, comment } = req.body || {};

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();
  await Review.refreshShelterRating(review.shelter);

  res.json({ review });
};

// DELETE /api/reviews/:id  (reviewer or admin)
const deleteReview = async (req, res) => {
  const review = await loadOwnReview(req, { allowAdmin: true });
  await review.deleteOne();
  await Review.refreshShelterRating(review.shelter);
  res.json({ message: "Review deleted" });
};

module.exports = { createReview, updateReview, deleteReview };
