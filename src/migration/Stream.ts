import mongoose from "mongoose";
import Queue from "../models/queueModel";
import dotenv from "dotenv";

dotenv.config();

// Connect to your MongoDB database
const connectDB = async () => {
  await mongoose.connect(
    `mongodb+srv://sherooxd2007:HSq2DbEzrDJrQ3OZ@vibe.48x3k.mongodb.net/?retryWrites=true&w=majority&appName=vibe`,
    {}
  );
};

// Update downloadUrl in existing Queue documents
const updateQueueDownloadUrl = async () => {
  try {
    // Connect to the database
    await connectDB();

    await Queue.deleteMany({
      "songData.downloadUrl.url": {
        $regex: "https://sstream-af4g.onrender.com",
      }, // Match the old URL
    });

    console.log(` Queue documents have been updated with the new downloadUrl.`);
  } catch (error) {
    console.error("Error updating Queue download URL:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the update script
updateQueueDownloadUrl();
