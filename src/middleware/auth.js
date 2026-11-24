import { prisma } from "../config/index.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }

        const token = authorization.slice(7);
        const payload = verifyAccessToken(token);
        const userId = Number(payload.sub);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                error: "Invalid access token",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                error: "Invalid or expired access token",
            });
        }

        next(error);
    }
};
