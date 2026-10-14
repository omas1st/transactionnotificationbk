const cloudinary = require("cloudinary").v2;
const { parseDataUri, extensionFromMime } = require("../utils/helpers");

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER || "transaction-notifier/logos";

/* ------------------------------------------------------------------ */
/*  Upload                                                             */
/* ------------------------------------------------------------------ */

/**
 * Uploads a base64 data URI to Cloudinary and returns the secure URL.
 *
 * @param {string} dataUri     `data:image/png;base64,...`
 * @param {string} publicIdBase Optional prefix for the generated public id.
 * @returns {Promise<{url:string, publicId:string, format:string, bytes:number, width:number, height:number}>}
 */
const uploadLogoFromDataUri = (dataUri, publicIdBase = "logo") => {
  return new Promise((resolve, reject) => {
    if (!dataUri) {
      reject(new Error("No image data supplied."));
      return;
    }

    const parsed = parseDataUri(dataUri);
    if (!parsed) {
      reject(new Error("Invalid image data URI."));
      return;
    }

    const safePrefix = String(publicIdBase || "logo")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);

    const uniqueId = `${safePrefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        public_id: uniqueId,
        resource_type: "image",
        overwrite: false,
        format: extensionFromMime(parsed.mimeType),
        // Normalise dimensions so the logo renders consistently in every inbox.
        transformation: [
          { width: 400, height: 400, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(Buffer.from(parsed.base64, "base64"));
  });
};

/* ------------------------------------------------------------------ */
/*  Delete (best-effort cleanup)                                       */
/* ------------------------------------------------------------------ */

const deleteLogo = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.error(
      `Failed to delete Cloudinary asset ${publicId}:`,
      error.message
    );
    return null;
  }
};

module.exports = { uploadLogoFromDataUri, deleteLogo };