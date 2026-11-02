import { Router } from "express";

import { prisma } from "../config/index.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../schemas/users.schema.js";

const router = Router();

router.get("/", async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.user.count(),
        ]);

        res.json({
            data: users,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                posts: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.post("/", validate(createUserSchema), async (req, res, next) => {
    try {
        const user = await prisma.user.create({
            data: req.body,
        });

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
});

router.patch("/:id", validate(updateUserSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: req.body,
        });

        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        await prisma.user.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
