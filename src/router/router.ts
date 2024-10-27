import express from "express";
import { homeResponse } from "../lib/utils";
import { authMiddleware } from "../middleware/auth";
import { search } from "../functions/Search";
import { login } from "../functions/Login";
import { queue } from "../functions/Queue";
import { addToQueue } from "../functions/AddToQueue";
const router = express.Router();

router.get("/", (_req, res) => {
  res.json(homeResponse);
});

router.post("/api/auth", login);

router.use(authMiddleware);
router.get("/api/search", search);
router.get("/api/queue", queue);
router.get("/api/listeners", queue);
router.post("/api/add", addToQueue);

export default router;
