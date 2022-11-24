import * as yup from "yup";

const customQuestionSchema = yup.object({
    question: yup.string().required(),
    correct_answer: yup.string().required(),
});

export default customQuestionSchema;
