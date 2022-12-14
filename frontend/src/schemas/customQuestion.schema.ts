import * as yup from "yup";

const customQuestionSchema = yup.object({
    question: yup.string().required().default("").label("Question content"),
});

export default customQuestionSchema;
