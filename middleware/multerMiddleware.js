import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
  fileFilter: (req, file, cb) => {
    const allowedImageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoMimeTypes = ["video/mp4", "video/webm", "video/ogg"];

    if (file.fieldname === "videoFile") {
      if (!allowedVideoMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            "Only MP4, WebM, or Ogg video files are allowed for videoFile!"
          ),
          false
        );
      }
    } else if (
      file.fieldname === "thumbnailFile" ||
      file.fieldname === "channelAvatar"
    ) {
      if (!allowedImageMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            `Only JPEG, PNG, GIF, or WebP image files are allowed for ${file.fieldname}!`
          ),
          false
        );
      }
    } else if (file.fieldname === "channelBanner") {
      if (!allowedImageMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            "Only JPEG, PNG, GIF, or WebP image files are allowed for channelBanner!"
          ),
          false
        );
      }
    } else {
      return cb(new Error(`Unexpected file field: ${file.fieldname}`), false);
    }

    cb(null, true);
  },
});

export default upload;
