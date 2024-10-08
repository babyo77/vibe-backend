import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },
  },
  { timestamps: true }
);

const Vote = mongoose.models?.Vote || mongoose.model("Vote", voteSchema);
export default Vote;
