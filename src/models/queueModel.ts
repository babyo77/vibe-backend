import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
    songData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
queueSchema.index({ roomId: 1, order: 1 }); // Index on roomId and order for efficient sorting
const Queue = mongoose.models?.Queue || mongoose.model("Queue", queueSchema);
export default Queue;
