// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import { getUserById } from "../database/database.js";

export default async function (req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res
            .status(401)
            .json({ message: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await getUserById(decoded.id);
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
}
