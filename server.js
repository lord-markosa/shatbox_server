// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import verifyToken from "./middleware/auth.js";
import path from "path";
import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const serviceClient = new WebPubSubServiceClient(
    process.env.AZURE_PS_CONN_STR,
    process.env.AZURE_PS_HUB
);

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.set("serviceClient", serviceClient);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", verifyToken, chatRoutes);
app.use("/api/story", verifyToken, storyRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
