// backend/routes/chatRoutes.js
import express from "express";
import {
    createChat,
    getChatById,
    getMessagesByChatId,
    getNewPotentialChatPartners,
    insertMessage,
} from "../database/database.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Save a new chat
router.get("/new", async (req, res) => {
    const user = req.user;
    try {
        const potentialPartners = await getNewPotentialChatPartners(user.id);
        if (potentialPartners.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        const newPartner = potentialPartners[0];
        const id = uuidv4();
        await createChat(
            id,
            user.id,
            user.username,
            newPartner.id,
            newPartner.username
        );
        res.status(201).json({
            id,
            username1: user.username,
            username2: newPartner.username,
        });
    } catch (error) {
        console.error(`Error creating chat: ${error}`);
        res.status(500).json({ message: "Failed to fetch new chat" });
    }
});

// Get a chat
router.get("/:chatId", async (req, res) => {
    const { chatId } = req.params;
    const user = req.user;
    try {
        const chat = await getMessagesByChatId(chatId, user.id);
        if (chat) {
            res.status(200).json(chat);
        } else {
            res.status(404).json({ message: "Chat not found" });
        }
    } catch (error) {
        console.error(`Error getting chat: ${error}`);
        res.status(500).json({ message: "Failed to fetch chat" });
    }
});

// Send message in a chat
router.post("/:chatId/send", async (req, res) => {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    // web pub sub service client
    const serviceClient = req.app.get("serviceClient");
    try {
        const chat = await getChatById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }
        const { user1Id, user2Id } = chat;
        if (senderId !== user1Id && senderId !== user2Id) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const id = uuidv4();
        const recipientId = senderId === user1Id ? user2Id : user1Id;
        await insertMessage(id, chatId, senderId, recipientId, content);
        res.status(201).json({
            id,
            timestamp: Date.now(),
            content,
            sent: true,
        });
        await serviceClient.sendToUser(recipientId, {
            chatId,
            message: { id, content, sent: false },
        });
    } catch (error) {
        console.error(`Error sending message: ${error}`);
        res.status(500).json({ message: "Failed to send message" });
    }
});

// Delete a saved chat
router.delete("/delete/:chatId", (req, res) => {
    // const { chatId } = req.params;
    // const user = req.user;
    // user.chats = user.chats.filter((chat) => chat.id !== chatId);
    // updateUser(user);
    // deleteChat(chatId);
    // res.status(204).send();
});

export default router;
