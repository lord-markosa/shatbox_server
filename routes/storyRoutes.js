import express from "express";
import {
    createStory,
    deleteStory,
    getAllStory,
    getStoryById,
    likeStory,
    updateStory,
} from "../models/dao.js";

const router = express.Router();

// Get all story (this should not be explicitly required for now)
router.get("/", async (_, res) => {
    try {
        res.status(200).json(await getAllStory());
    } catch (error) {
        res.status(500).json({ message: "Error fetching Story", error });
    }
});

// Add a new story
router.post("/", async (req, res) => {
    const { content } = req.body;
    try {
        res.status(201).json(
            await createStory({
                content,
                createdAt: new Date(),
                createdBy: req.user.username,
            })
        );
    } catch (error) {
        res.status(500).json({ message: "Error creating story", error });
    }
});

// Like a story
router.get("/:id/like", async (req, res) => {
    try {
        await likeStory(req.params.id, req.user.id);
        res.status(200).json({ message: "Story liked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error: like failed", error });
    }
});

// Update a story
router.put("/:id", async (req, res) => {
    const { content } = req.body;

    try {
        // get the story
        const story = await getStoryById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        // check if the user is the creator of the story
        if (story.createdBy !== req.user.username) {
            return res
                .status(403)
                .json({ message: "You are not the creator of this story" });
        }

        story.content = content;
        story.createdAt = new Date();

        // update the story
        await updateStory(story);
        res.status(200).json({ message: "Story updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating story", error });
    }
});

// Delete a story
router.delete("/:id", async (req, res) => {
    const storyId = req.params.id;
    try {
        // get the story
        const story = await getStoryById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        // check if the user is the creator of the story
        if (story.createdBy !== req.user.username) {
            return res
                .status(403)
                .json({ message: "You are not the creator of this story" });
        }

        // delete the story
        await deleteStory(storyId);
        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting story", error });
    }
});

export default router;
