import Joi from "joi";

export const createPostSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().allow("", null),
    published: Joi.boolean(),
    authorId: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string().trim().min(1)),
});

export const updatePostSchema = Joi.object({
    title: Joi.string(),
    content: Joi.string().allow("", null),
    published: Joi.boolean(),
    authorId: Joi.number().integer().positive(),
    tags: Joi.array().items(Joi.string().trim().min(1)),
}).min(1);
