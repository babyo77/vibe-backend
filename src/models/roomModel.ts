import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      maxLength: 8,
    },
    progress: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      maxLength: 50,
    },
  },
  { timestamps: true }
);
roomSchema.index({ roomId: 1 }, { unique: true });
const Room = mongoose.models?.Room || mongoose.model("Room", roomSchema);

export default Room;
