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
import { getMetadata } from "../functions/getMetadata";
import { checkRoom } from "../functions/CheckRoom";
import { updateUser } from "../functions/UpdateUser";
import { updateUserDp } from "../functions/updateUserDP";
import asyncHandler from "../lib/asyncHandler";
import { getSpotifyTrack } from "../functions/getSpotifyTrack";
import { discordLogin } from "../functions/discordLogin";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(homeResponse);
});

router.post("/api/auth", asyncHandler(login));
router.get("/api/auth/discord", asyncHandler(discordLogin));
router.get("/api/checkroom", asyncHandler(checkRoom));

// unauthorized users api
router.post("/api/metadata", asyncHandler(getMetadata));
router.get("/api/spotify/:id", asyncHandler(getSpotifyTrack));
router.get("/api/search", asyncHandler(search));
router.get("/api/upNextSong", asyncHandler(upNextSong));
router.get("/api/listeners", asyncHandler(roomListeners));
router.get("/api/youtube", asyncHandler(getPlaylist));

// both  authorized n unauthorized users api
router.get("/api/queue", queueMiddleware, asyncHandler(queue));

// authorized users api
router.use(authMiddleware);
router.get("/api/vibe", asyncHandler(checkVibe));
router.post("/api/add", asyncHandler(addToQueue));
router.get("/api/@me", asyncHandler(getMe));
router.get("/api/rooms/:type", asyncHandler(getRooms));
router.patch("/api/update", asyncHandler(updateUser));
router.patch("/api/dp", asyncHandler(updateUserDp));

export default router;
