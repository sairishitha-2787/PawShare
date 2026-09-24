const mongoose = require("mongoose");
const geoPointSchema = require("./geoPoint");

const { HTTP_URL } = require("../utils/validators");

const SPECIES = ["dog", "cat", "bird", "rabbit", "other"];
const SIZES = ["small", "medium", "large", "xlarge"];
const AGE_GROUPS = ["baby", "young", "adult", "senior"];

// Age groups in months: baby < 12, young < 36, adult < 96, senior 96+
const ageGroupFor = (months) => {
  if (months < 12) return "baby";
  if (months < 36) return "young";
  if (months < 96) return "adult";
  return "senior";
};

const healthRecordSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  date: { type: Date, default: Date.now },
  vetName: { type: String, trim: true, maxlength: 100 },
  notes: { type: String, trim: true, maxlength: 1000 },
});

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 500, match: HTTP_URL },
    publicId: { type: String, trim: true }, // storage-provider id, for deletes
  },
  { _id: false }
);

const animalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    species: { type: String, required: true, enum: SPECIES },
    breed: { type: String, trim: true, default: "Mixed", maxlength: 60 },
    ageMonths: { type: Number, required: true, min: 0, max: 400 },
    ageGroup: { type: String, enum: AGE_GROUPS },
    // required on fields with defaults so an explicit null is rejected instead of saved
    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
      required: true,
    },
    size: { type: String, required: true, enum: SIZES },
    color: { type: String, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 2000 },

    photos: {
      type: [photoSchema],
      default: [],
      validate: { validator: (p) => p.length <= 10, message: "at most 10 photos" },
    },
    healthRecords: { type: [healthRecordSchema], default: [] },
    vaccinated: { type: Boolean, default: false },
    neutered: { type: Boolean, default: false },
    temperament: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: { validator: (t) => t.length <= 15, message: "at most 15 temperament tags" },
    },

    listingType: {
      type: String,
      enum: ["adoption", "foster", "both"],
      default: "adoption",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "pending", "adopted", "fostered"],
      default: "available",
      required: true,
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    location: {
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      coordinates: { type: geoPointSchema },
    },
  },
  { timestamps: true }
);

animalSchema.pre("validate", function () {
  if (this.ageMonths != null) this.ageGroup = ageGroupFor(this.ageMonths);
});

animalSchema.index({ species: 1, breed: 1, size: 1, status: 1 });
animalSchema.index({ "location.city": 1 });
animalSchema.index({ owner: 1 });
animalSchema.index({ "location.coordinates": "2dsphere" });
animalSchema.index({ name: "text", breed: "text", description: "text" });

const Animal = mongoose.model("Animal", animalSchema);

module.exports = Animal;
module.exports.SPECIES = SPECIES;
module.exports.SIZES = SIZES;
module.exports.AGE_GROUPS = AGE_GROUPS;
module.exports.ageGroupFor = ageGroupFor;
