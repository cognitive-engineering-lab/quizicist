import * as yup from "yup";

export const CONTENT_TYPES = ["Markdown", "Text"];

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
});

export default uploadSchema;
