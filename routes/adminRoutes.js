import express from "express";
import { createTables, dropTables } from "../database/tableOperations.js";

const router = express.Router();

router.get("/create-tables", async (req, res) => {
    const { admin_key } = req.body;
    if (admin_key !== process.env.ADMIN_KEY) {
        return res
            .status(403)
            .json({ message: "You are not allowed to perform this operation" });
    }
    await createTables();
    res.json({ message: "Tables created successfully" });
});

router.get("/drop-tables", async (req, res) => {
    const { admin_key } = req.body;
    if (admin_key !== process.env.ADMIN_KEY) {
        return res
            .status(403)
            .json({ message: "You are not allowed to perform this operation" });
    }
    await dropTables();
    res.json({ message: "Tables dropped successfully" });
});

export default router;
