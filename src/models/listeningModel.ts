import mongoose from "mongoose";

const listeningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    songId: {
      type: String,
      required: true,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ["youtube", "jio"],
      required: true,
      default: "jio",
    },
    lastPlayedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Listening =
  mongoose.models.Listening || mongoose.model("listening", listeningSchema);
