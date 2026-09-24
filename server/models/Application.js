const mongoose = require("mongoose");

const STATUSES = ["pending", "approved", "rejected", "withdrawn"];

// Lifestyle answers the shelter uses to judge a match.
const answersSchema = new mongoose.Schema(
  {
    homeType: { type: String, enum: ["house", "apartment", "other"] },
    hasYard: { type: Boolean },
    hasChildren: { type: Boolean },
    otherPets: { type: String, trim: true, maxlength: 300 },
    hoursAlonePerDay: { type: Number, min: 0, max: 24 },
    experience: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Copied from animal.owner so shelters can list their applications without a join.
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["adoption", "foster"], required: true },
    status: { type: String, enum: STATUSES, default: "pending" },

    message: { type: String, trim: true, maxlength: 2000 },
    answers: { type: answersSchema, default: {} },
    fosterUntil: { type: Date }, // only meaningful for foster applications

    shelterNote: { type: String, trim: true, maxlength: 1000 },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ shelter: 1, status: 1, createdAt: -1 });
applicationSchema.index({ animal: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
module.exports.STATUSES = STATUSES;
