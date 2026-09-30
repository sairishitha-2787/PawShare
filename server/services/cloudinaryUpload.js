const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads an image from a local file path or a base64 string
async function uploadImage(filePathOrBase64) {
  const result = await cloudinary.uploader.upload(filePathOrBase64, {
    folder: "pawshare_animals",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

module.exports = { uploadImage };