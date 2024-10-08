"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roomSchema = new mongoose_1.default.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        maxLength: 8,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false,
    },
}, { timestamps: true });
const Room = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Room) || mongoose_1.default.model("Room", roomSchema);
exports.default = Room;
