"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServer = runServer;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function runServer(app) {
    mongoose_1.default
        .connect(process.env.MONGODB_URL || "")
        .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`db connected - Server is running on port ${process.env.PORT}`);
        });
    })
        .catch(() => {
        console.error("Failed to connect to the database");
        process.exit(1);
    });
}
