// Rejects request bodies containing MongoDB operators ("$ne", "$gt", ...) or dotted keys.
// Without this, {"animalId": {"$ne": null}} would match an arbitrary document in findById.
const hasUnsafeKey = (value, depth = 0) => {
  if (depth > 20) return true; // absurdly deep nesting
  if (Array.isArray(value)) return value.some((v) => hasUnsafeKey(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.entries(value).some(
      ([key, v]) => key.startsWith("$") || key.includes(".") || hasUnsafeKey(v, depth + 1)
    );
  }
  return false;
};

const rejectOperators = (req, res, next) => {
  if (hasUnsafeKey(req.body)) {
    return res.status(400).json({ message: "Field names may not start with '$' or contain '.'" });
  }
  next();
};

module.exports = rejectOperators;
