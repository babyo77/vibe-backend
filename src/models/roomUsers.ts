import mongoose from "mongoose";

const roomUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    saved: {
      type: Boolean,
      default: false,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    status: {
      type: Boolean,
    },
    role: {
      type: String,
      enum: ["admin", "listener"],
      default: "listener",
    },
    stayedFor: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const RoomUser =
  mongoose.models?.RoomUsers || mongoose.model("RoomUsers", roomUserSchema);

export default RoomUser;
