// Singleton Prisma client to reuse connections
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;