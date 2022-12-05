import * as yup from "yup";

const uploadSchema = yup.object({
    title: yup.string().required().default("").label("Quiz title"),
    content: yup.string().required().default("").label("Quiz content"),
    is_markdown: yup.boolean().default(false).label("'Is markdown'"),
});

export default uploadSchema;
