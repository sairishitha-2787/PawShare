const mongoose = require("mongoose");

// An adopter's review of a shelter/caregiver, tied to one approved application.
const reviewSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true, // one review per adoption/foster
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "rating must be a whole number" },
    },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ shelter: 1, createdAt: -1 });

// Recomputes the shelter's average rating and review count on its User document.
reviewSchema.statics.refreshShelterRating = async function (shelterId) {
  const [stats] = await this.aggregate([
    { $match: { shelter: new mongoose.Types.ObjectId(String(shelterId)) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await mongoose.model("User").updateOne(
    { _id: shelterId },
    {
      rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      ratingCount: stats ? stats.count : 0,
    }
  );
};

module.exports = mongoose.model("Review", reviewSchema);
