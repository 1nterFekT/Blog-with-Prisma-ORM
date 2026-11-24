import "dotenv/config";

import app from "./app.js";
import { prisma } from "./config/index.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const shutdown = async () => {
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
