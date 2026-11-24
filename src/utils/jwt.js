import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = 15 * 60;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

const getAccessSecret = () => {
    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    return process.env.JWT_ACCESS_SECRET;
};

const getRefreshSecret = () => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    return process.env.JWT_REFRESH_SECRET;
};

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            sub: String(user.id),
            type: "access",
        },
        getAccessSecret(),
        {
            expiresIn: ACCESS_TOKEN_TTL,
        },
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            sub: String(user.id),
            type: "refresh",
        },
        getRefreshSecret(),
        {
            expiresIn: REFRESH_TOKEN_TTL,
        },
    );
};

export const verifyAccessToken = (token) => {
    const payload = jwt.verify(token, getAccessSecret());

    if (typeof payload === "string" || payload.type !== "access") {
        throw new Error("Invalid access token");
    }

    return payload;
};

export const verifyRefreshToken = (token) => {
    const payload = jwt.verify(token, getRefreshSecret());

    if (typeof payload === "string" || payload.type !== "refresh") {
        throw new Error("Invalid refresh token");
    }

    return payload;
}
