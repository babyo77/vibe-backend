import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      maxLength: 8,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const Room = mongoose.models?.Room || mongoose.model("Room", roomSchema);

export default Room;
