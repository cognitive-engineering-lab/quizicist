import * as yup from "yup";

const questionSchema = yup.object({
    question: yup.string().required(),
    correct_answer: yup.string().required(),
    option_1: yup.string().required(),
    option_2: yup.string().required(),
    option_3: yup.string().required(),
});

export default questionSchema;
