import express from "express";
import verifyToken from "../middleware/auth.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { createUser, getAllStory, getUserByUsername } from "../models/dao.js";

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user

        const newUser = await createUser({
            username,
            password: hashedPassword,
            likedStories: [],
            chats: [],
            chatUserIds: [],
        });

        const userId = newUser.id;

        // Generate JWT token
        const token = generateToken(userId);

        // Fetch all story and user's chats
        const storyList = await getAllStory();

        // Send response with token, success message, storyList, and chats
        res.status(201).json({
            token,
            message: "User registered successfully",
            storyList,
            username: newUser.username,
            likedStories: newUser.likedStories,
            chats: newUser.chats,
            // generate a pubsub url negotiation
            negotiation: await negotiate(req, userId),
        });
    } catch (error) {
        console.error(`Error registering user: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

// User login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await getUserByUsername(username);
        const userId = user.id;

        // get the user by username
        if (!user) {
            return res.status(404).json({ message: "Invalid loginId" });
        }

        // Check if password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(404).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = generateToken(userId);

        // Fetch all story and user's chats
        const storyList = await getAllStory();

        res.json({
            token,
            message: "Login successful",
            storyList,
            likedStories: user.likedStories,
            chats: user.chats,
            username,
            // generate a pubsub url negotiation
            negotiation: await negotiate(req, userId),
        });
    } catch (error) {
        console.error(`Error logging in user: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Fetch user data from token
router.get("/data", verifyToken, async (req, res) => {
    try {
        const storyList = await getAllStory();
        const userId = req.user.id;
        const newToken = generateToken(userId);
        res.json({
            token: newToken,
            username: req.user.username,
            storyList,
            likedStories: req.user.likedStories,
            chats: req.user.chats,
            negotiation: await negotiate(req, userId),
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Web PubSub token negotiation
const negotiate = async (req, userId) => {
    const serviceClient = req.app.get("serviceClient");
    try {
        return await serviceClient.getClientAccessToken({
            userId,
        });
    } catch (error) {
        console.error(`Error negotiating token: ${error}`);
        return null;
    }
};

export default router;
