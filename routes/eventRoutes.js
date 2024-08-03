import express from "express";
import {
    addEvent,
    deleteEvent,
    getEvents,
    updateEvent,
} from "../data/localDataHandler.js";
import generateUniqueId from "../utils/generateUniqueId.js";

const router = express.Router();

router.get("", (_, res) => {
    res.json(getEvents());
});

router.post("", (req, res) => {
    const { title, description, date, time, location } = req.body;
    const username = req.user.username;
    if (!title || !date || !location || !time || !username) {
        return res.status(400).send("Content, alias, and userId are required");
    }
    const newEvent = {
        id: generateUniqueId(),
        title,
        description,
        date,
        time,
        location,
        username,
    };

    addEvent(newEvent);
    const io = req.app.get("io");
    io.emit("newEvent", newEvent); // Broadcast new story
    res.status(201).json(newEvent);
});

// Edit an event
router.put("/:id", (req, res) => {
    const username = req.user.username;
    const { title, description, date, time, location } = req.body;
    if (!title || !date || !time || !location || !username) {
        return res.status(400).send("Title, date, and location are required");
    }
    const updatedEvent = {
        id: req.params.id,
        title,
        description,
        date,
        time,
        location,
    };
    updateEvent(updatedEvent);
    const io = req.app.get("io");
    io.emit("updateEvent", updatedEvent); // Broadcast updated event
    res.status(200).json("Event updated");
});

// Delete an event
router.delete("/:id", (req, res) => {
    const eventId = req.params.id;
    deleteEvent(eventId);
    const io = req.app.get("io");
    io.emit("deleteEvent", eventId); // Broadcast deleted event
    res.status(200).json("Event deleted");
});

export default router;
