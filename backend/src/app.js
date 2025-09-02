require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const PgSession = require("connect-pg-simple")(session);
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");

const app = express();

const isProd = process.env.NODE_ENV === "production";
const enableCors = process.env.ENABLE_CORS === "true";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Trust proxy when in production or explicitly enabled
if (isProd || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

// Security headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

// Optional CORS
if (enableCors) {
    app.use(
        cors({
            origin: frontendOrigin,
            credentials: true
        })
    );
}

// JSON body parsing
app.use(express.json());

// Session with Postgres-backed store
app.use(
    session({
        name: process.env.SESSION_COOKIE_NAME || "connect.sid",
        secret: process.env.SESSION_SECRET || "defaultsecret",
        resave: false,
        saveUninitialized: false,
        store: new PgSession({
            conString: process.env.DATABASE_URL,
            tableName: process.env.SESSION_TABLE_NAME || "session",
            createTableIfMissing: true
        }),
        cookie: {
            httpOnly: true,
            secure: isProd || process.env.COOKIE_SECURE === "true",
            sameSite: enableCors ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 4 // 4 hours
        }
    })
);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));