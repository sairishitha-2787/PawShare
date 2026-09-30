const axios = require("axios");

async function geocodeAddress(address) {
  const apiKey = process.env.GEOCODING_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json`;

  const response = await axios.get(url, {
    params: {
      q: address,
      key: apiKey,
      limit: 1,
    },
  });

  const result = response.data.results[0];
  if (!result) {
    throw new Error("No location found for that address");
  }

  return {
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    formatted: result.formatted,
  };
}

module.exports = { geocodeAddress };