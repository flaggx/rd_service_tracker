const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");

const app = express();
app.use(bodyParser.json());

app.use(session({
  secret: "supersecret", // change in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if HTTPS
}));

app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
