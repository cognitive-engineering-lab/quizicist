import * as yup from "yup";

export const CONTENT_TYPES = ["Markdown", "Plain Text"];

const uploadSchema = yup.object({
    title: yup.string().required().default("").label("Quiz title"),
    content: yup.string().required().default("").label("Quiz content"),
    count: yup
        .number()
        .integer()
        .min(1)
        .max(15)
        .required()
        .default(5)
        .label("Number of questions"),
    content_type: yup
        .string()
        .oneOf(CONTENT_TYPES)
        .default(CONTENT_TYPES[0])
        .label("Content type"),
    is_custom_prompt: yup.boolean().default(false),
    custom_prompt: yup.string().when("is_custom_prompt", {
        is: true,
        then: yup.string().required().default("").label("Custom prompt")
    })     
});

export default uploadSchema;
