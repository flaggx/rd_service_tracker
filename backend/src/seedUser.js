const bcrypt = require("bcrypt");
const prisma = require("./prisma");

async function seedUser() {
    try {
        const username = "admin";
        const plainPassword = "changeme"; // CHANGE THIS after first login
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await prisma.user.upsert({
            where: { username },
            update: {},
            create: { username, passwordHash },
        });

        console.log("✅ Seed user ensured (username: admin, password: changeme)");
    } catch (err) {
        console.error("Error seeding user:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedUser();