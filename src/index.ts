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
import { getVotesArray, getSongsWithVoteCounts } from "./lib/utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "./models/userModel";
import Room from "./models/roomModel";
import RoomUser from "./models/roomUsers";
import upVote from "./handlers/upVote";
import Vote from "./models/voteModel";
import deleteSong from "./handlers/deleteSong";
import { errorHandler } from "./handlers/error";
import Queue from "./models/queueModel";
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
    const token = socket.handshake.headers["authorization"];
    const roomId = socket.handshake.headers["room"];
    if (!token) throw new Error("unauthorized");
    if (!roomId) throw new Error("roomId not provided");
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
          { isActive: true },
          { upsert: true, new: true }
        );
        const role = await RoomUser.findOne({
          roomId: room._id,
          userId: user?.id,
        });
        socket.roomInfo = {
          _id: room._id.toString(),
          roomId: room.roomId.toString(),
        };
        if (role) {
          socket.role = role.role.toString();
        }
      }
    }
    next();
  } catch (error: any) {
    console.log("MIDDLEWARE ERROR:", error.message);
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
  socket.on("deleteSong", (data) => {
    deleteSong(socket, data);
  });
  socket.on("upVote", (data) => {
    upVote(socket, data);
  });
  socket.on("getSongQueue", async () => {
    const { roomInfo, userId } = socket;
    if (!roomInfo || !userId) throw new Error("Login to play");
    const queue = await getSongsWithVoteCounts(roomInfo._id, userId);
    socket.emit("queueList", queue);
  });
  socket.on("songEnded", async (data: searchResults) => {
    try {
      const { roomInfo, userId } = socket;
      if (!roomInfo || !userId) throw new Error("Login to play");

      await Vote.deleteMany({
        queueId: data.queueId,
        roomId: roomInfo._id,
      });
      const queue = await getSongsWithVoteCounts(roomInfo._id, userId, true);
      let nextSong = queue[0];
      const currentSongIndex = queue.findIndex((song) => song.id === data.id); // Assuming data.id contains the ID of the ended song

      // Handle edge cases (ended song not found in queue)
      if (currentSongIndex === -1) {
        nextSong = queue[0];
      }

      // Calculate the index of the next song
      const nextSongIndex = (currentSongIndex + 1) % queue.length; // Wrap around to the beginning if it's the last song

      // Get the next song based on the calculated index
      nextSong = queue[nextSongIndex];

      const votes = await getVotesArray(roomInfo._id, userId);
      const mostVotedSongCount = Math.max(
        ...queue.map((song) => song.voteCount)
      );
      nextSong =
        mostVotedSongCount == 0
          ? nextSong
          : queue.find((song) => song.voteCount === mostVotedSongCount);
      await Queue.updateMany({ roomId: roomInfo._id }, { isPlaying: false });
      await Queue.updateOne(
        {
          roomId: roomInfo._id,
          "songData.id": nextSong.id,
        },
        { isPlaying: true }
      );
      const payload = {
        play: nextSong,
        queue,
        votes,
      };

      io.to(roomInfo.roomId).emit("songEnded", payload);
    } catch (error: any) {
      console.log("SONGEND ERROR:", error.message);
      errorHandler(socket, error.message);
    }
  });

  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
});

runServer(server);
