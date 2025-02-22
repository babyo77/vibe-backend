import mongoose from "mongoose";
import dotenv from "dotenv";
import cronsJobs from "../cron/cron";
dotenv.config();
export function runServer(app: any) {
  mongoose
    .connect(process.env.MONGODB_URL || "")
    .then(() => {
      cronsJobs();
      app.listen(process.env.PORT, () => {
        console.log(`DB CONNECTED ⚡️ - http://localhost:${process.env.PORT}`);
      });
    })
    .catch(() => {
      console.error("Failed to connect to the database");
      process.exit(1);
    });
}
