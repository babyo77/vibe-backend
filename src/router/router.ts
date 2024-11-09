import express from "express";
import { homeResponse } from "../lib/utils";
import { authMiddleware } from "../middleware/auth";
import { search } from "../functions/Search";
import { login } from "../functions/Login";
import { queue } from "../functions/Queue";
import { addToQueue } from "../functions/AddToQueue";
import { roomListeners } from "../functions/RoomListeners";
import { queueMiddleware } from "../middleware/queueMiddleware";
import { upNextSong } from "../functions/upNextSong";
import { getMe } from "../functions/Me";
import { getRooms } from "../functions/getRoom";
import { checkVibe } from "../functions/CheckVibe";
import { getPlaylist } from "../functions/getPlaylist";
const router = express.Router();

router.get("/", (_req, res) => {
  res.json(homeResponse);
});

router.post("/api/auth", login);

// unauthorized users api
router.get("/api/search", search);
router.get("/api/upNextSong", upNextSong);
router.get("/api/listeners", roomListeners);
router.get("/api/youtube", getPlaylist);
// both  authorized n unauthorized users api
router.get("/api/queue", queueMiddleware, queue);

// authorized users api
router.use(authMiddleware);
router.get("/api/vibe", checkVibe);
router.post("/api/add", addToQueue);
router.get("/api/@me", getMe);
router.get("/api/rooms", getRooms);

export default router;
