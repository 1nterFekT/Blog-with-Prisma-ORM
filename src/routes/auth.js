import { Router } from "express";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";

import { prisma } from "../config/index.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.js";

const router = Router();

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

const COOKIE_NAME = "refreshToken";

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth",
});

const hashToken = (token) => {
    return createHash("sha256").update(token).digest("hex");
};

const saveRefreshToken = async (userId, token) => {
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(token),
            userId,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        },
    });
};

const setRefreshCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions(),
        maxAge: REFRESH_TOKEN_TTL,
    });
};

const clearRefreshCookie = (res) => {
    res.clearCookie(COOKIE_NAME, cookieOptions());
};

const getPublicUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
    try {
        const { email, name, password } = req.body;

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordValid) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user.id, refreshToken);

        setRefreshCookie(res, refreshToken);

        res.json({
            message: "Login successful",
            accessToken,
            user: getPublicUser(user),
        });
    } catch (error) {
        next(error);
    }
});

router.post("/refresh", async (req, res, next) => {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
        return res.status(401).json({
            error: "Refresh token required",
        });
    }

    try {
        const payload = verifyRefreshToken(refreshToken);
        const tokenHash = hashToken(refreshToken);

        const storedToken = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: true,
            },
        });

        if (
            !storedToken ||
            storedToken.revokedAt ||
            storedToken.expiresAt <= new Date() ||
            String(storedToken.userId) !== payload.sub
        ) {
            clearRefreshCookie(res);

            return res.status(401).json({
                error: "Invalid or expired refresh token",
            });
        }

        const newAccessToken = generateAccessToken(storedToken.user);
        const newRefreshToken = generateRefreshToken(storedToken.user);

        const newTokenHash = hashToken(newRefreshToken);

        const rotated = await prisma.$transaction(async (tx) => {
            const result = await tx.refreshToken.updateMany({
                where: {
                    id: storedToken.id,
                    revokedAt: null,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                data: {
                    revokedAt: new Date(),
                },
            });

            if (result.count !== 1) {
                return false;
            }

            await tx.refreshToken.create({
                data: {
                    tokenHash: newTokenHash,
                    userId: storedToken.userId,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
                },
            });

            return true;
        });

        if (!rotated) {
            clearRefreshCookie(res);

            return res.status(401).json({
                error: "Refresh token already used",
            });
        }

        setRefreshCookie(res, newRefreshToken);

        res.json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "tokenExpiredError"
        ) {
            clearRefreshCookie(res);

            return res.status(401).json({
                error: "Invalid or expired refresh token",
            });
        }
    }

    next(error);
});

router.post("/logout", async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[COOKIE_NAME];

        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: {
                    tokenHash: hashToken(refreshToken),
                    revokedAt: null,
                },
                data: {
                    revokedAt: new Date(),
                },
            });
        }

        clearRefreshCookie(res);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

router.get("/me", authenticate, async (req, res) => {
    res.json({
        user: req.user,
    });
});

export default router;
