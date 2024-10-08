"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./lib/db");
const prevSong_1 = require("./handlers/prevSong");
const nextSong_1 = require("./handlers/nextSong");
const handleJoinRoom_1 = require("./handlers/handleJoinRoom");
const handleDisconnect_1 = require("./handlers/handleDisconnect");
const addQueue_1 = __importDefault(require("./handlers/addQueue"));
const utils_1 = require("./lib/utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("./models/userModel"));
const roomModel_1 = __importDefault(require("./models/roomModel"));
const roomUsers_1 = __importDefault(require("./models/roomUsers"));
const upVote_1 = __importDefault(require("./handlers/upVote"));
const voteModel_1 = __importDefault(require("./models/voteModel"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ALLOWED_URL,
        credentials: true,
    },
});
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = (0, utils_1.parseCookies)(socket.handshake.headers.cookie)) === null || _a === void 0 ? void 0 : _a.vibeId;
        const roomId = (_b = (0, utils_1.parseCookies)(socket.handshake.headers.cookie)) === null || _b === void 0 ? void 0 : _b.room;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "");
            if (decoded && typeof decoded.userId === "string") {
                const user = yield userModel_1.default.findById(decoded === null || decoded === void 0 ? void 0 : decoded.userId);
                if (!user)
                    throw new Error("Could not find user");
                socket.userId = user === null || user === void 0 ? void 0 : user._id.toString();
                const room = yield roomModel_1.default.findOneAndUpdate({ roomId }, { isActive: true }, { upsert: true, new: true });
                const role = yield roomUsers_1.default.findOne({
                    roomId: room._id,
                    userId: user === null || user === void 0 ? void 0 : user.id,
                });
                socket.roomInfo = { _id: room._id, roomId: room.roomId.toString() };
                if (role) {
                    socket.role = role.role.toString();
                }
            }
        }
        next();
    }
    catch (error) {
        console.log("MIDDLEWARE ERROR:", error.message);
        return next(new Error((error === null || error === void 0 ? void 0 : error.message) || "Invalid token"));
    }
}));
io.on("connection", (socket) => {
    (0, handleJoinRoom_1.handleJoinRoom)(socket);
    socket.on("nextSong", (data) => {
        (0, nextSong_1.nextSong)(socket, data);
    });
    socket.on("prevSong", (data) => {
        (0, prevSong_1.prevSong)(socket, data);
    });
    socket.on("seek", (seek) => {
        const { roomInfo, role, userId } = socket;
        if (!roomInfo)
            return;
        if (role === "admin" && roomInfo.roomId) {
            socket.to(roomInfo.roomId).emit("seek", { seek, role, userId });
        }
    });
    socket.on("addToQueue", (data) => {
        (0, addQueue_1.default)(socket, data);
    });
    socket.on("upVote", (data) => {
        (0, upVote_1.default)(socket, data);
    });
    socket.on("songEnded", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomInfo, userId } = socket;
        if (!roomInfo)
            return;
        yield voteModel_1.default.deleteMany({
            queueId: data.queueId,
            roomId: roomInfo._id,
        });
        const queue = yield (0, utils_1.getSongsWithVoteCounts)(roomInfo._id);
        const votes = yield (0, utils_1.getVotesArray)(roomInfo._id, userId);
        const mostVotedSongCount = Math.max(...queue.map((song) => song.voteCount));
        const payload = {
            play: queue.find((song) => song.voteCount === mostVotedSongCount),
            queue,
            votes,
        };
        io.to(roomInfo.roomId).emit("songEnded", payload);
    }));
    socket.on("disconnect", () => {
        (0, handleDisconnect_1.handleDisconnect)(socket);
    });
});
(0, db_1.runServer)(server);
