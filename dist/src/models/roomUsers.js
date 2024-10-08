"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roomUserSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    socketId: {
        type: String,
        required: true,
    },
    roomId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "listener"],
        default: "listener",
    },
}, { timestamps: true });
const RoomUser = mongoose_1.default.model("RoomUsers", roomUserSchema);
exports.default = RoomUser;
