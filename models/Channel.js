// Mongoose schema and model for Channel.
import mongoose from "mongoose";

const channelSchema = mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    channelBanner: {
      type: String,
      default:
        "https://res.cloudinary.com/your_cloud_name/image/upload/v1/youtube-clone/defaults/default_banner.png",
      match: [
        /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
        "Please enter a valid URL",
      ], // Basic URL validation
    },
    channelBannerPublicId: {
      type: String,
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/your_cloud_name/image/upload/v1/youtube-clone/defaults/default_avatar.png",
      match: [
        /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
        "Please enter a valid URL",
      ],
    },
    profilePicturePublicId: {
      type: String,
    },
    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
