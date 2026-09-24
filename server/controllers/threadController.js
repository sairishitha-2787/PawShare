const mongoose = require("mongoose");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const Animal = require("../models/Animal");
const User = require("../models/User");

const USER_FIELDS = "name role isVerified";
const ANIMAL_FIELDS = "name species photos status";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const populateThread = (query) =>
  query.populate("participants", USER_FIELDS).populate("animal", ANIMAL_FIELDS);

// Loads a thread and checks the logged-in user is in it.
const loadThreadFor = async (req) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) throw httpError(404, "Conversation not found");
  if (!thread.participants.some((p) => p.equals(req.user._id))) {
    throw httpError(403, "You are not part of this conversation");
  }
  return thread;
};

// Unread counts per thread: messages from the other person that haven't been read.
const unreadByThread = async (threadIds, userId) => {
  const rows = await Message.aggregate([
    { $match: { thread: { $in: threadIds }, sender: { $ne: userId }, readAt: null } },
    { $group: { _id: "$thread", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
};

// POST /api/threads  { recipientId?, animalId? }
// With only animalId, the conversation is with the animal's shelter.
const startThread = async (req, res) => {
  const { recipientId, animalId } = req.body || {};

  let animal = null;
  if (animalId) {
    animal = await Animal.findById(animalId);
    if (!animal) throw httpError(404, "Animal not found");
  }

  const otherId = recipientId || animal?.owner;
  if (!otherId) throw httpError(400, "recipientId or animalId is required");
  if (String(otherId) === String(req.user._id)) {
    throw httpError(400, "You cannot message yourself");
  }
  if (!(await User.exists({ _id: otherId }))) throw httpError(404, "Recipient not found");

  const key = Thread.keyFor(req.user._id, otherId, animal?._id);
  let thread = await Thread.findOne({ key });
  let created = false;

  if (!thread) {
    try {
      thread = await Thread.create({
        participants: [req.user._id, otherId],
        animal: animal?._id,
        key,
      });
      created = true;
    } catch (err) {
      // Both people opened the chat at the same moment; use the one that won.
      if (err.code !== 11000) throw err;
      thread = await Thread.findOne({ key });
    }
  }

  thread = await populateThread(Thread.findById(thread._id));
  res.status(created ? 201 : 200).json({ thread });
};

// GET /api/threads  (newest activity first, with unread counts)
const listThreads = async (req, res) => {
  const threads = await populateThread(
    Thread.find({ participants: req.user._id }).sort({ updatedAt: -1 })
  );
  const unread = await unreadByThread(threads.map((t) => t._id), req.user._id);

  res.json({
    threads: threads.map((t) => {
      const json = t.toJSON();
      return {
        ...json,
        otherParticipant: json.participants.find((p) => !req.user._id.equals(p._id)) || null,
        unreadCount: unread.get(String(t._id)) || 0,
      };
    }),
  });
};

// GET /api/threads/unread-count  (total, for the nav badge)
const unreadCount = async (req, res) => {
  const threadIds = await Thread.find({ participants: req.user._id }).distinct("_id");
  const count = await Message.countDocuments({
    thread: { $in: threadIds },
    sender: { $ne: req.user._id },
    readAt: null,
  });
  res.json({ count });
};

// GET /api/threads/:id/messages?before=<messageId>&limit=30
// Returns the newest page, oldest-first; pass the first message's _id as `before` for older ones.
// Paging by _id (not createdAt) so messages sent in the same millisecond are never skipped.
const getMessages = async (req, res) => {
  const thread = await loadThreadFor(req);

  const filter = { thread: thread._id };
  if (req.query.before) {
    if (!mongoose.isValidObjectId(req.query.before)) {
      throw httpError(400, "before must be a message id");
    }
    filter._id = { $lt: String(req.query.before) };
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const page = await Message.find(filter).sort({ _id: -1 }).limit(limit + 1);

  const hasMore = page.length > limit;
  const messages = page.slice(0, limit).reverse();

  res.json({ messages, hasMore });
};

// POST /api/threads/:id/messages  { text }
const sendMessage = async (req, res) => {
  const thread = await loadThreadFor(req);

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) throw httpError(400, "text is required");

  const message = await Message.create({ thread: thread._id, sender: req.user._id, text });

  thread.lastMessage = { text: message.text, sender: message.sender, at: message.createdAt };
  await thread.save();

  res.status(201).json({ message });
};

// PATCH /api/threads/:id/read  (marks the other person's messages as read)
const markRead = async (req, res) => {
  const thread = await loadThreadFor(req);

  const result = await Message.updateMany(
    { thread: thread._id, sender: { $ne: req.user._id }, readAt: null },
    { readAt: new Date() }
  );

  res.json({ marked: result.modifiedCount });
};

module.exports = {
  startThread,
  listThreads,
  unreadCount,
  getMessages,
  sendMessage,
  markRead,
};
