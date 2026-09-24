const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Requires a valid "Authorization: Bearer <token>" header and loads req.user.
const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }

  const user = await User.findById(payload.id);
  if (!user) {
    return res.status(401).json({ message: "Not authorized, user no longer exists" });
  }

  req.user = user;
  next();
};

// Usage: authorize("shelter", "admin") — must come after protect.
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }
  next();
};

module.exports = { protect, authorize };
