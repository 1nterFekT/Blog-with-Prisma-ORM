import Joi from "joi";

export const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid("USER", "ADMIN"),
});

export const updateUserSchema = Joi.object({
    email: Joi.string().email(),
    name: Joi.string().min(2),
    role: Joi.string().valid("USER", "ADMIN"),
}).min(1);
