import mongoose from "mongoose";

// Define the queue schema
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
      id: { type: String, required: true },
      name: { type: String, required: true },
      artists: {
        primary: [
          {
            id: { type: Number, required: false },
            name: { type: String, required: false },
            role: { type: String, required: false },
            image: { type: [String], required: false }, // Array of image URLs
            type: { type: String, enum: ["artist"], required: false },
            url: { type: String, required: true },
          },
        ],
      },
      image: [
        {
          quality: { type: String, required: false },
          url: { type: String, required: false },
        },
      ],
      downloadUrl: [
        {
          quality: { type: String, required: false },
          url: { type: String, required: false },
        },
      ],
      addedBy: { type: String, required: false },
      queueId: { type: String, required: false },
      voteCount: { type: Number, required: true, default: 0 },
      topVoters: { type: [String], required: false }, // Array of user IDs
      isVoted: { type: Boolean, required: false, default: false },
    },
  },
  { timestamps: true }
);

// Create or use the Queue model
const Queue = mongoose.models?.Queue || mongoose.model("Queue", queueSchema);
export default Queue;
