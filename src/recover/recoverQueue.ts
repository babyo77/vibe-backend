import Queue from "../models/queueModel";

async function deleteDeletedQueue() {
  try {
    // Delete all rooms marked as not deleted in one operation
    const result = await Queue.updateMany({
      roomId: "",
      deleted: false,
    });
    console.log(`Deleted ${result.modifiedCount} rooms marked as not deleted.`);

    console.log("Completed not-deleted room cleanup process.");
  } catch (error) {
    console.error("Error deleting not-deleted rooms:", error);
  }
}
