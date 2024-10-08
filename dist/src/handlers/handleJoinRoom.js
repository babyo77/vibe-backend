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
exports.handleJoinRoom = handleJoinRoom;
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const userModel_1 = __importDefault(require("../models/userModel"));
const error_1 = require("./error");
function handleJoinRoom(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId, roomInfo } = socket;
            // Find the user
            const user = yield userModel_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            if (!roomInfo) {
                throw new Error("Room not found");
            }
            // Find the total number of documents for pagination metadata
            const totalUsers = yield roomUsers_1.default.countDocuments({ roomId: roomInfo._id });
            // Update or create room user entry
            const addedUser = yield roomUsers_1.default.findOneAndUpdate({ userId, roomId: roomInfo._id }, {
                isActive: true,
                socketid: socket.id,
                role: totalUsers == 0 ? "admin" : socket.role ? socket.role : "listener",
            }, { upsert: true, new: true }).populate("userId");
            if (!addedUser) {
                throw new Error("Unable to join room");
            }
            socket.join(roomInfo.roomId.toString());
            socket.emit("joinedRoom", {
                user: Object.assign({}, addedUser.toObject()),
            });
            socket.to(roomInfo.roomId.toString()).emit("userJoinedRoom", {
                user,
            });
        }
        catch (error) {
            console.log("JOIN ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
