const bcrypt = require("bcrypt");
const db = require("./db");

async function seedUser() {
  const username = "admin";
  const plainPassword = "changeme"; // CHANGE THIS after first login
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  db.run(
    "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)",
    [username, passwordHash],
    function (err) {
      if (err) {
        console.error("Error seeding user:", err.message);
      } else {
        console.log("✅ Seed user created (username: admin, password: changeme)");
      }
      db.close();
    }
  );
}

seedUser();
