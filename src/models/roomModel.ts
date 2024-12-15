import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      maxLength: 8,
    },
  },
  { timestamps: true }
);
roomSchema.index({ roomId: 1 }, { unique: true });
const Room = mongoose.models?.Room || mongoose.model("Room", roomSchema);

export default Room;
