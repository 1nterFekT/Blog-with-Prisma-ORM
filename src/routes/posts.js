import { Router } from "express";

import { prisma } from "../config/index.js";
import { validate } from "../middleware/validate.js";
import { createPostSchema, updatePostSchema } from "../schemas/posts.schema.js";

const router = Router();

router.get("/", async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

        const { search, published, authorId } = req.query;

        const where = {};

        if (search) {
            where.title = {
                contains: search,
            };
        }

        if (published !== undefined) {
            if (!["true", "false"].includes(published)) {
                return res.status(400).json({
                    error: "published must be true or false",
                });
            }

            where.published = published === "true";
        }

        if (authorId !== undefined) {
            const parsedAuthorId = Number(authorId);

            if (!Number.isInteger(parsedAuthorId) || parsedAuthorId <= 0) {
                return res.status(400).json({
                    error: "authorId must be a positive integer",
                });
            }

            where.authorId = parsedAuthorId;
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    author: true,
                    tags: true,
                },
            }),
            prisma.post.count({ where }),
        ]);

        res.json({
            data: posts,
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
                error: "Invalid post ID",
            });
        }

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: true,
                tags: true,
            },
        });

        if (!post) {
            return res.status(404).json({
                error: "Post not found",
            });
        }

        res.json(post);
    } catch (error) {
        next(error);
    }
});

router.post("/", validate(createPostSchema), async (req, res, next) => {
    try {
        const { title, content, published, authorId, tags = [] } = req.body;

        const post = await prisma.post.create({
            data: {
                title,
                content,
                published,
                author: {
                    connect: {
                        id: authorId,
                    },
                },
                tags: {
                    connectOrCreate: tags.map((name) => ({
                        where: { name },
                        create: { name },
                    })),
                },
            },
            include: {
                author: true,
                tags: true,
            },
        });

        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
});

router.patch("/:id", validate(updatePostSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid post ID",
            });
        }

        const { authorId, tags, ...data } = req.body;

        if (authorId !== undefined) {
            data.author = {
                connect: {
                    id: authorId,
                },
            };
        }

        if (tags !== undefined) {
            data.tags = {
                set: [],
                connectOrCreate: tags.map((name) => ({
                    where: { name },
                    create: { name },
                })),
            };
        }

        const post = await prisma.post.update({
            where: { id },
            data,
            include: {
                author: true,
                tags: true,
            },
        });

        res.json(post);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid post ID",
            });
        }

        await prisma.post.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
