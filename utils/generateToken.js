import jwt from "jsonwebtoken";

// Generate JWT
export default function (id) {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}
