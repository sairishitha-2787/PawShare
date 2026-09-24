const mongoose = require("mongoose");
const { HTTP_URL } = require("../utils/validators");

const DAY_MS = 24 * 60 * 60 * 1000;

// Scheduled check-ins created when an application is approved.
const SCHEDULE = [
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

const healthUpdateSchema = new mongoose.Schema(
  {
    condition: { type: String, enum: ["great", "good", "fair", "poor"], required: true },
    weightKg: { type: Number, min: 0, max: 200 },
    eatingWell: { type: Boolean },
    vetVisit: { type: Boolean },
    notes: { type: String, trim: true, maxlength: 2000 },
    photos: {
      type: [{ type: String, trim: true, maxlength: 500, match: HTTP_URL }],
      default: [],
    },
  },
  { _id: false }
);

const checkInSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
    adopter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // "scheduled" ones come from SCHEDULE; "adhoc" ones are health updates logged any time.
    kind: { type: String, enum: ["scheduled", "adhoc"], default: "scheduled" },
    label: { type: String, trim: true },
    dueDate: { type: Date },

    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    completedAt: { type: Date },
    healthUpdate: { type: healthUpdateSchema },

    remindedAt: { type: Date }, // set by the reminder job once a reminder is sent
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

checkInSchema.virtual("isOverdue").get(function () {
  return this.status === "pending" && !!this.dueDate && this.dueDate < new Date();
});

checkInSchema.index({ adopter: 1, status: 1, dueDate: 1 });
checkInSchema.index({ shelter: 1, status: 1, dueDate: 1 });
checkInSchema.index({ animal: 1, createdAt: -1 });

// Builds the scheduled check-ins for a newly approved application.
// Foster check-ins that would fall after the foster end date are skipped (the first one is always kept).
checkInSchema.statics.scheduleFor = function (application, from = new Date()) {
  const docs = SCHEDULE.map(({ label, days }) => ({
    application: application._id,
    animal: application.animal,
    adopter: application.applicant,
    shelter: application.shelter,
    kind: "scheduled",
    label,
    dueDate: new Date(from.getTime() + days * DAY_MS),
  })).filter(
    (doc, i) =>
      i === 0 || application.type !== "foster" || !application.fosterUntil ||
      doc.dueDate <= application.fosterUntil
  );
  return this.insertMany(docs);
};

module.exports = mongoose.model("CheckIn", checkInSchema);
module.exports.SCHEDULE = SCHEDULE;
