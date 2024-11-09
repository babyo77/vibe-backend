import Queue from "../../models/queueModel";
import Room from "../../models/roomModel";

async function deleteEmptyRooms() {
  try {
    // Find all rooms
    const rooms = await Room.find();

    // Loop through each room to check if it has songs in the queue
    for (const room of rooms) {
      const songCount = await Queue.countDocuments({ roomId: room._id });

      // If the room has no songs in the queue, delete it
      if (songCount === 0) {
        await Room.findByIdAndDelete(room._id);
        console.log(`Deleted room with ID: ${room.roomId}`);
      }
    }

    console.log("Completed empty room deletion process.");
  } catch (error) {
    console.error("Error deleting empty rooms:", error);
  }
}

export default deleteEmptyRooms;
