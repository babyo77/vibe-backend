import mongoose, { Schema, Document, Model } from "mongoose";

enum BookmarkType {
  ROOM = "room",
  YOUTUBE = "youtube",
  SPOTIFY = "spotify",
  OTHER = "other",
}

interface IBookmark extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  type: BookmarkType;
  image: string;
  uri: string;
}

const BookmarkSchema: Schema<IBookmark> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(BookmarkType),
      required: true,
    },
    image: {
      type: String,
      default:
        "https://i.pinimg.com/736x/70/5a/b0/705ab0bbad4e3f8b070f0f3f38640ccc.jpg",
      trim: true,
    },
    uri: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bookmark: Model<IBookmark> = mongoose.model<IBookmark>(
  "Bookmarks",
  BookmarkSchema
);

export { Bookmark, BookmarkType };
