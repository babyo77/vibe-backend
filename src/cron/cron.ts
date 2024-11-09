import cron from "node-cron";
import deleteEmptyRooms from "./functions/deleteEmptyRooms";
export default function cronsJobs() {
  try {
    console.log("added crons jobs");
    // Schedule the job to run every hour
    cron.schedule("0 * * * *", () => {
      console.log("Running scheduled task to delete empty rooms...");
      deleteEmptyRooms();
    });
  } catch (error) {
    console.error("Failed to schedule crons jobs", error);
  }
}
