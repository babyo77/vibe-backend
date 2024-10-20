import mongoose from "mongoose";
import Queue from "../models/queueModel";
import dotenv from "dotenv";
dotenv.config();
// Connect to your MongoDB database
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL || "", {});
};

// Update order field in existing Queue documents by roomId
const updateQueueOrder = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Fetch distinct roomIds from the Queue collection
    const roomIds = await Queue.distinct("roomId");

    // Iterate over each roomId and update orders
    for (const roomId of roomIds) {
      // Fetch all Queue documents for the current roomId, sorted by createdAt
      const queues = await Queue.find({ roomId }).sort({ createdAt: 1 });

      let order = 1; // Initialize an order counter for this room

      for (const queue of queues) {
        // Assign an incremental order value to each document within the room
        await Queue.updateOne({ _id: queue._id }, { $set: { order } });
        order += 1; // Increment order for the next document
      }
    }

    console.log("All Queue documents have been updated with order by room.");
  } catch (error) {
    console.error("Error updating Queue order:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the update script
updateQueueOrder();
