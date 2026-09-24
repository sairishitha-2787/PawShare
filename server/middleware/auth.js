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

// Loads req.user when a valid token is sent, but lets anonymous requests through.
const optionalAuth = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = (await User.findById(payload.id)) || undefined;
    } catch (err) {
      // Bad token on a public route: treat as anonymous.
    }
  }
  next();
};

// Usage: authorize("shelter", "admin") — must come after protect.
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }
  next();
};

// Shelters must be verified by an admin before this action; admins always pass.
const requireVerified = (req, res, next) => {
  if (req.user.role !== "admin" && !req.user.isVerified) {
    return res.status(403).json({
      message: "Your shelter must be verified before you can do this",
      verificationStatus: req.user.verification?.status,
    });
  }
  next();
};

module.exports = { protect, optionalAuth, authorize, requireVerified };
