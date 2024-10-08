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

    socketId: {
      type: String,
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "listener"],
      default: "listener",
    },
  },
  { timestamps: true },
);

const RoomUser = mongoose.model("RoomUsers", roomUserSchema);

export default RoomUser;
