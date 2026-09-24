const CheckIn = require("../models/CheckIn");

const DAY_MS = 24 * 60 * 60 * 1000;

// For the reminder job (email/cron): pending check-ins due within `withinDays`
// (including overdue ones) that haven't been reminded yet, with the adopter's contact details.
const getDueReminders = ({ withinDays = 1, now = new Date() } = {}) =>
  CheckIn.find({
    status: "pending",
    remindedAt: null,
    dueDate: { $lte: new Date(now.getTime() + withinDays * DAY_MS) },
  })
    .sort({ dueDate: 1 })
    .populate("adopter", "name email")
    .populate("animal", "name");

// Call after the reminders were sent so they aren't sent twice.
const markReminded = (ids, at = new Date()) =>
  CheckIn.updateMany({ _id: { $in: ids } }, { remindedAt: at });

module.exports = { getDueReminders, markReminded };
