const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: { type: Date, default: null }, // set when the other participant reads it
  },
  { timestamps: true }
);

messageSchema.index({ thread: 1, createdAt: -1 });
messageSchema.index({ thread: 1, sender: 1, readAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
