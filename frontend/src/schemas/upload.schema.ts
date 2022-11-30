import * as yup from "yup";

const uploadSchema = yup.object({
    title: yup.string().required().default(""),
    content: yup.string().required().default(""),
    is_markdown: yup.boolean().default(false),
});

export default uploadSchema;
