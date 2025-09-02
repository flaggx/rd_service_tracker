const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const prisma = require("../prisma");
const router = express.Router();

// Rate limit for login to reduce brute-force attempts
// Adjust windowMs and max to your needs
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." }
});

// Session introspection: who am I?
router.get("/me", async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(200).json({ authenticated: false });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true }
        });

        if (!user) {
            return res.status(200).json({ authenticated: false });
        }

        res.json({ authenticated: true, user });
    } catch (err) {
        next(err);
    }
});

router.post("/login", loginLimiter, async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ message: "Missing credentials" });

        const user = await prisma.user.findUnique({ where: { username } });
        // Use a generic error to avoid user enumeration
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ message: "Invalid credentials" });

        // Regenerate session to prevent fixation, then set userId
        await new Promise((resolve, reject) => {
            req.session.regenerate(err => (err ? reject(err) : resolve()));
        });
        req.session.userId = user.id;

        res.json({ message: "Logged in" });
    } catch (err) {
        next(err);
    }
});

router.post("/logout", (req, res) => {
    // Destroy server session and clear the cookie
    const cookieName = (req.session?.cookie?.name) || process.env.SESSION_COOKIE_NAME || "connect.sid";
    req.session.destroy(() => {
        res.clearCookie(cookieName);
        res.json({ message: "Logged out" });
    });
});

module.exports = router;