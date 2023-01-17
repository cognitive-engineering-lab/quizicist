import * as yup from "yup";

const addQuestionsSchema = yup.object({
    count: yup
        .number()
        .integer()
        .min(1)
        .max(10)
        .required()
        .default(5)
        .label("Number of questions"),
});

export default addQuestionsSchema;
