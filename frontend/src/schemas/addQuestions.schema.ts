import * as yup from "yup";

const addQuestionsSchema = yup.object({
    count: yup
        .number()
        .min(0)
        .max(5)
        .required()
        .default(5)
        .label("Number of questions"),
});

export default addQuestionsSchema;
