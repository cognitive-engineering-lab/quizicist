import * as yup from "yup";

const questionSchema = yup.object({
    question: yup.string().required(),
    correct_answer: yup.string().required(),
    option1: yup.string().required(),
    option2: yup.string().required(),
    option3: yup.string().required(),
});

export default questionSchema;
