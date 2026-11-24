import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middleware/errorHandler.js";
import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";

const app = express();

app.use(helmet());

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);

app.get("/", (req, res) => {
    res.json({
        message: "Blog API is running",
    });
});

app.use(errorHandler);

export default app;
