const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  location: user.location,
  isVerified: user.isVerified,
  rating: user.rating,
  ratingCount: user.ratingCount,
  verificationStatus: user.role === "shelter" ? user.verification?.status : undefined,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = sanitizeUser;
