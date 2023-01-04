import * as yup from "yup";

const uploadSchema = yup.object({
    title: yup.string().required().default("").label("Quiz title"),
    content: yup.string().required().default("").label("Quiz content"),
    count: yup
        .number()
        .min(0)
        .max(5)
        .required()
        .default(5)
        .label("Number of questions"),
    is_markdown: yup.boolean().default(false).label("Is markdown"),
});

export default uploadSchema;
