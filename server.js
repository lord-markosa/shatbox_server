// backend/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import verifyToken from "./middleware/auth.js";
import { establishConnection } from "./database/database.js";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const serviceClient = new WebPubSubServiceClient(
    process.env.AZURE_PS_CONN_STR,
    process.env.AZURE_PS_HUB
);

app.use(cors());
app.use(bodyParser.json());

app.set("io", io);
app.set("serviceClient", serviceClient);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", verifyToken, chatRoutes);
app.use("/api/story", verifyToken, storyRoutes);
app.use("/api/events", verifyToken, eventRoutes);
app.use("/api/activities", verifyToken, activityRoutes);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    establishConnection();
});
