import express from "express";
import { cors, limiter } from "./lib/utils";
import useCors from "cors";
import { errorHandler } from "./functions/apiError";
import asyncHandler from "./lib/asyncHandler";
import { search } from "./functions/Search";
import { configDotenv } from "dotenv";
configDotenv();
const app = express();

app.use(useCors(cors));
app.use(limiter);
app.get("/api/search", asyncHandler(search));
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});

export default app;
