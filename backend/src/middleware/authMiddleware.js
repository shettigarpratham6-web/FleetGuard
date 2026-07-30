const jwt = require("jsonwebtoken");

// Renamed inner function to 'authMiddleware' so it doesn't clash
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "supersecretkeyreplaceinproduction"
        );

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};

// Exported as 'authenticateToken' so vehicleRoutes.js receives it with that exact name
module.exports = authMiddleware;