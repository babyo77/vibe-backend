"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const queueSchema = new mongoose_1.default.Schema({
    roomId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    playing: {
        type: Boolean,
        default: false,
    },
    songData: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });
const Queue = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Queue) || mongoose_1.default.model("Queue", queueSchema);
exports.default = Queue;
