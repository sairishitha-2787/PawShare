const mongoose = require("mongoose");

// A conversation between two users, optionally about one animal.
const threadSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (ids) => ids.length === 2,
        message: "A thread must have exactly two participants",
      },
    },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal" },

    // "<smallerUserId>_<largerUserId>_<animalId|general>" — one thread per pair per animal.
    key: { type: String, required: true, unique: true },

    lastMessage: {
      text: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

threadSchema.index({ participants: 1, updatedAt: -1 });

threadSchema.statics.keyFor = (userA, userB, animalId) => {
  const [a, b] = [String(userA), String(userB)].sort();
  return `${a}_${b}_${animalId ? String(animalId) : "general"}`;
};

module.exports = mongoose.model("Thread", threadSchema);
