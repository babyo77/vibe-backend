import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import { CustomSocket, searchResults } from "../types";
import { prevSong } from "./handlers/prevSong";
import { nextSong } from "./handlers/nextSong";
import { handleJoinRoom } from "./handlers/handleJoinRoom";
import { handleDisconnect } from "./handlers/handleDisconnect";
import addQueue from "./handlers/addQueue";
import {
  getVotesArray,
  getSongsWithVoteCounts,
  parseCookies,
} from "./lib/utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "./models/userModel";
import Room from "./models/roomModel";
import RoomUser from "./models/roomUsers";
import upVote from "./handlers/upVote";
import Vote from "./models/voteModel";
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_URL,
    credentials: true,
  },
});

io.use(async (socket: CustomSocket, next) => {
  try {
    const token = parseCookies(socket.handshake.headers.cookie)?.vibeId;
    const roomId = parseCookies(socket.handshake.headers.cookie)?.room;
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as JwtPayload;
      if (decoded && typeof decoded.userId === "string") {
        const user = await User.findById(decoded?.userId);
        if (!user) throw new Error("Could not find user");
        socket.userId = user?._id.toString();
        const room = await Room.findOneAndUpdate(
          { roomId },
          { active: true },
          { upsert: true, new: true }
        );
        const role = await RoomUser.findOne({
          roomId: room._id,
          userId: user?.id,
        });
        socket.roomInfo = { _id: room._id, roomId: room.roomId.toString() };
        if (role) {
          socket.role = role.role.toString();
        }
      }
    }
    next();
  } catch (error: any) {
    console.log(error);
    return next(new Error(error?.message || "Invalid token"));
  }
});

io.on("connection", (socket: CustomSocket) => {
  handleJoinRoom(socket);

  socket.on("nextSong", (data) => {
    nextSong(socket, data);
  });
  socket.on("prevSong", (data) => {
    prevSong(socket, data);
  });
  socket.on("seek", (seek) => {
    const { roomInfo, role, userId } = socket;
    if (!roomInfo) return;
    if (role === "admin" && roomInfo.roomId) {
      socket.to(roomInfo.roomId).emit("seek", { seek, role, userId });
    }
  });
  socket.on("addToQueue", (data) => {
    addQueue(socket, data);
  });
  socket.on("upVote", (data) => {
    upVote(socket, data);
  });

  socket.on("songEnded", async (data: searchResults) => {
    const { roomInfo, userId } = socket;
    if (!roomInfo) return;
    await Vote.deleteMany({
      queueId: data.queueId,
      roomId: roomInfo._id,
    });
    const queue = await getSongsWithVoteCounts(roomInfo._id);

    const votes = await getVotesArray(roomInfo._id, userId);
    const mostVotedSongCount = Math.max(...queue.map((song) => song.voteCount));
    const payload = {
      play: queue.find((song) => song.voteCount === mostVotedSongCount),
      queue,
      votes,
    };

    io.to(roomInfo.roomId).emit("songEnded", payload);
  });

  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
});

runServer(server);
