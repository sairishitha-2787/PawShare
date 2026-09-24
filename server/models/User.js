const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["adopter", "shelter", "admin"],
      default: "adopter",
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      // GeoJSON point: coordinates are [longitude, latitude]
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          default: undefined,
        },
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Average of this shelter's reviews; kept up to date by Review.refreshShelterRating.
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    // Shelter verification request; isVerified mirrors status === "approved".
    verification: {
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "approved", "rejected"],
        default: "unsubmitted",
      },
      registrationNumber: { type: String, trim: true, maxlength: 100 },
      about: { type: String, trim: true, maxlength: 2000 },
      website: { type: String, trim: true, maxlength: 300 },
      documentUrl: { type: String, trim: true, maxlength: 500 },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String, trim: true, maxlength: 1000 },
    },
  },
  { timestamps: true }
);

userSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("User", userSchema);
