import express from "express";
import verifyToken from "../middleware/auth.js";
import generateToken from "../utils/generateToken.js";
import {
    createUser,
    getAllStory,
    getUserByUsername,
    getUserChats,
} from "../database/database.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const router = express.Router();

const getWpsToken = async (req, userId) => {
    const serviceClient = req.app.get("serviceClient");
    return serviceClient.getClientAccessToken({
        userId,
    });
};

// User registration
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken" });
        }

        // Create a id
        const id = uuidv4();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = { id, username, password: hashedPassword };
        const createUserDbResponse = await createUser(newUser);

        // Fetch user to get userId
        const user = await getUserByUsername(username);

        // Generate JWT token
        const token = generateToken(id);

        // Fetch all story and user's chats
        const storyList = await getAllStory();

        // Get WPS token
        const wpsToken = await getWpsToken(req, user.id);

        // Send response with token, success message, storyList, and chats
        res.status(201).json({
            token,
            message: "User registered successfully",
            storyList,
            username,
            wpsToken,
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
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user.id);
            const storyList = await getAllStory();
            const chats = await getUserChats(user.id);
            const wpsToken = await getWpsToken(req);

            res.json({
                token,
                message: "Login successful",
                storyList,
                chats,
                username,
                wpsToken,
            });
        } else {
            res.sendStatus(403);
        }
    } catch (error) {
        console.error(`Error logging in user: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Fetch user data from token
router.get("/data", verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const storyList = await getAllStory();
        const chats = await getUserChats(userId);
        const wpsToken = await getWpsToken(req);

        res.json({ storyList, chats, username: req.user.username, wpsToken });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Notification token
router.get("/negotiate", verifyToken, async (req, res) => {
    const serviceClient = req.app.get("serviceClient");
    try {
        res.json(
            await serviceClient.getClientAccessToken({
                userId: req.user.id,
            })
        );
    } catch (error) {
        console.error(`Error negotiating token: ${error}`);
        res.status(500).json({ message: "An error occurred" });
    }
});

export default router;
