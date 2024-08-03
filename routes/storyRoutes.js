import express from "express";
import {
    createStory,
    deleteStory,
    getAllStory,
    getStoryById,
    likeStory,
    updateStory,
} from "../database/database.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Get all story
router.get("/", (_, res) => {
    try {
        res.status(200).json(getAllStory());
    } catch (error) {
        res.status(500).json({ message: "Error fetching Story", error });
    }
});

// Add a new story
router.post("/", async (req, res) => {
    const { content } = req.body;
    const createdAt = new Date();
    const creator = req.user.username;
    const likedBy = [];

    const newStory = { id: uuidv4(), content, createdAt, creator, likedBy };

    try {
        const storyId = await createStory(newStory);
        res.status(201).json({
            ...newStory,
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating story", error });
    }
});

// Like a story
router.post("/:id/like", async (req, res) => {
    const storyId = req.params.id;
    const username = req.user.username;

    try {
        const story = await getStoryById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.likedBy.includes(username)) {
            return res
                .status(400)
                .json({ message: "You have already liked this story" });
        }

        await likeStory(storyId, username);
        res.status(200).json({ message: "Story liked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error liking story", error });
    }
});

// Update a story
router.put("/:id", async (req, res) => {
    const storyId = req.params.id;
    const { content } = req.body;
    const updatedAt = new Date();

    try {
        const story = await getStoryById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.creator !== req.user.username) {
            return res
                .status(403)
                .json({ message: "You are not the creator of this story" });
        }

        await updateStory(storyId, { content, updatedAt });
        res.status(200).json({ message: "Story updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating story", error });
    }
});

// Delete a story
router.delete("/:id", async (req, res) => {
    const storyId = req.params.id;

    try {
        const story = await getStoryById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.creator !== req.user.username) {
            return res
                .status(403)
                .json({ message: "You are not the creator of this story" });
        }

        await deleteStory(storyId);
        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting story", error });
    }
});

export default router;
