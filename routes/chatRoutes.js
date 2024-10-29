import express from "express";
import {
    addChatToUser,
    createChat,
    getChatById,
    getRandomUser,
    insertMessageIntoChat,
} from "../models/dao.js";

const router = express.Router();

// Create a new chat
router.get("/new", async (req, res) => {
    const user = req.user;
    try {
        // search for a new chat partner
        const potentialPartner = await getRandomUser(user.id, user.chatUserIds);
        if (!potentialPartner) {
            return res.status(404).json({ message: "No users found" });
        }

        // create a new chat
        const newChat = await createChat({
            user1: { id: user.id, username: user.username },
            user2: {
                id: potentialPartner.id,
                username: potentialPartner.username,
            },
            messages: [],
        });

        // add chat to user's chat list
        await Promise.all([
            addChatToUser(user.id, potentialPartner, newChat.id, true),
            addChatToUser(potentialPartner.id, user, newChat.id, false),
        ]);

        res.status(201).json({
            chatId: newChat.id,
            partnerName: potentialPartner.username,
        });
    } catch (error) {
        console.error(`Error creating chat: ${error}`);
        res.status(500).json({ message: "Failed to fetch new chat" });
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

        const userId1 = chat.user1.id;
        const userId2 = chat.user2.id;

        if (userId1 !== senderId && userId2 !== senderId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const receiverId = userId1 === senderId ? userId2 : userId1;

        const message = {
            timestamp: Date.now(),
            content,
            sentBy1: senderId === chat.user1.id,
        };

        await insertMessageIntoChat(chatId, message);

        res.status(201).json(message);

        await serviceClient.sendToUser(receiverId, { chatId, message });
    } catch (error) {
        console.error(`Error sending message: ${error}`);
        res.status(500).json({ message: "Failed to send message" });
    }
});

// Get a chat
router.get("/:chatId", async (req, res) => {
    const { chatId } = req.params;
    const user = req.user;
    try {
        const chat = await getChatById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        return res.status(200).json({ messages: chat.messages });
    } catch (error) {
        console.error(`Error getting chat: ${error}`);
        res.status(500).json({ message: "Failed to fetch chat" });
    }
});

// [TODO] Delete a saved chat
// router.delete("/delete/:chatId", (req, res) => {
//     // const { chatId } = req.params;
//     // const user = req.user;
//     // user.chats = user.chats.filter((chat) => chat.id !== chatId);
//     // updateUser(user);
//     // deleteChat(chatId);
//     // res.status(204).send();
// });

export default router;
