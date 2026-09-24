const mongoose = require("mongoose");
const geoPointSchema = require("./geoPoint");

const { HTTP_URL } = require("../utils/validators");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be a valid email address"],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    role: {
      type: String,
      enum: ["adopter", "shelter", "admin"],
      default: "adopter",
      required: true,
    },
    location: {
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      coordinates: { type: geoPointSchema },
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
      website: { type: String, trim: true, maxlength: 300, match: HTTP_URL },
      documentUrl: { type: String, trim: true, maxlength: 500, match: HTTP_URL },
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
