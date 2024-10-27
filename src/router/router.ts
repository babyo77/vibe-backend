import express from "express";
import { homeResponse } from "../lib/utils";
import { authMiddleware } from "../middleware/auth";
import { search } from "../functions/Search";
import { login } from "../functions/Login";
import { queue } from "../functions/Queue";
import { addToQueue } from "../functions/AddToQueue";
import { roomListeners } from "../functions/RoomListeners";
// import { getUser } from "../functions/getUser";
const router = express.Router();

router.get("/", (_req, res) => {
  res.json(homeResponse);
});

router.post("/api/auth", login);

// router.get("/api/getUser", authMiddleware, getUser);
router.get("/api/search", search);
router.get("/api/queue", queue);
router.get("/api/listeners", roomListeners);
router.post("/api/add", authMiddleware, addToQueue);

export default router;
