import cron from "node-cron";
import {
  deleteDeletedQueue,
  deleteEmptyRooms,
  deleteTempLinks,
} from "./functions/cronFunctions";
export default function cronsJobs() {
  try {
    console.log("ADDED CRON JOBS ⚡️");
    // Schedule the job to run every hour
    cron.schedule("0 * * * *", () => {
      console.log("Running scheduled task to delete empty rooms...");
      deleteEmptyRooms();
    });
    cron.schedule("0 0 * * *", () => {
      console.log("Running scheduled task to delete all temp links...");
      deleteTempLinks();
    });
    cron.schedule("0 0 * * 0", () => {
      console.log("Running scheduled task to delete deleted queue rooms...");
      deleteDeletedQueue();
    });
  } catch (error) {
    console.error("Failed to schedule crons jobs", error);
  }
}
