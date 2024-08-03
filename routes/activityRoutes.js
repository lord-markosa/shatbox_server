import { Router } from "express";
import {
    addActivity,
    deleteActivity,
    getActivities,
    updateActivity,
} from "../data/localDataHandler.js";
import generateUniqueId from "../utils/generateUniqueId.js";

const router = Router();

// Fetch all activities
router.get("/", (_, res) => {
    res.send(getActivities());
});

// Create a new activity
router.post("/", (req, res) => {
    const { title, description, steps } = req.body;
    const username = req.user.username;
    if (!title || !steps || !username) {
        return res.status(400).send("Title, steps, and username are required");
    }
    const newActivity = {
        id: generateUniqueId(),
        title,
        description,
        steps,
        username,
    };
    addActivity(newActivity);
    const io = req.app.get("io");
    io.emit("newActivity", newActivity); // Broadcast new activity
    res.status(201).json(newActivity);
});

// Update an existing activity
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { title, steps } = req.body;
    const username = req.user.username;
    if (!title || !steps || !username) {
        return res.status(400).send("Title, steps, and username are required");
    }
    const updatedActivity = {
        id,
        title,
        steps,
        username,
    };
    updateActivity(updatedActivity);
    const io = req.app.get("io");
    io.emit("updateActivity", updatedActivity); // Broadcast updated activity
    res.status(200).json(updatedActivity);
});

// Delete an activity
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    deleteActivity(id);
    const io = req.app.get("io");
    io.emit("deleteActivity", id); // Broadcast deleted activity
    res.status(200).send("Activity deleted");
});

export default router;
