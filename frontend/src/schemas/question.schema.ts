import * as yup from "yup";

const questionSchema = yup.object({
    question: yup.string().required(),
    correct_answer: yup.string().required(),
    distractors: yup.array().of(yup.object({
        text: yup.string().required(),
        locked: yup.boolean().default(false),
    })),
});

export default questionSchema;
