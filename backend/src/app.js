require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors"); // <--- added
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// -----------------------------
// CORS setup
// -----------------------------
app.use(cors({
  origin: "http://localhost:5173", // your frontend Vite dev server
  credentials: true                // allow cookies for session
}));

// -----------------------------
// Body parser
// -----------------------------
app.use(bodyParser.json());

// -----------------------------
// Database connection
// -----------------------------
const DB_FILE = process.env.DATABASE_FILE || "./data.sqlite";
const db = new sqlite3.Database(DB_FILE);
module.exports = db;

// -----------------------------
// Session setup
// -----------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true if HTTPS
  })
);

// -----------------------------
// Routes
// -----------------------------
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
