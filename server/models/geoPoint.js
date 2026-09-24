const mongoose = require("mongoose");

// GeoJSON point shared by User and Animal locations.
// Validated here so bad coordinates give a 400 instead of a database error from the 2dsphere index.
const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    // [longitude, latitude]
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (c) =>
          c.length === 2 && c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90,
        message: "coordinates must be [longitude, latitude] within valid ranges",
      },
    },
  },
  { _id: false }
);

module.exports = geoPointSchema;
