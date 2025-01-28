import mongoose, { Document } from "mongoose";

interface IListening extends Document {
  userId: mongoose.Types.ObjectId;
  songId: string;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  { timestamps: true }
);

export const Listening = (mongoose.models.Listening ||
  mongoose.model<IListening>(
    "listening",
    listeningSchema
  )) as mongoose.Model<IListening>;
