const express = require("express");
const db = require("../db");
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
  next();
}

router.get("/", requireAuth, (req, res) => {
  db.all("SELECT * FROM tickets", [], (err, rows) => {
    res.json(rows);
  });
});

router.post("/", requireAuth, (req, res) => {
  const { title, description } = req.body;
  db.run(
    "INSERT INTO tickets (title, description, status, created_at, updated_at) VALUES (?, ?, 'unscheduled', datetime('now'), datetime('now'))",
    [title, description],
    function (err) {
      res.json({ id: this.lastID, title, description, status: "unscheduled" });
    }
  );
});

router.put("/:id", requireAuth, (req, res) => {
  const { status } = req.body;
  db.run(
    "UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?",
    [status, req.params.id],
    function () {
      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
