import Joi from "joi";

export const registerSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    name: Joi.string().trim().min(2).max(100).required(),
    password: Joi.string().min(8).max(72).required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(1).max(72).required(),
});
