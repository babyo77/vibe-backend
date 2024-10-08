import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    songData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const Queue = mongoose.models?.Queue || mongoose.model("Queue", queueSchema);
export default Queue;
