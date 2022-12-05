import * as yup from "yup";

const customQuestionSchema = yup.object({
    question: yup.string().required().default("").label("Question content"),
    correct_answer: yup.string().required().default("").label("Correct answer"),
});

export default customQuestionSchema;
