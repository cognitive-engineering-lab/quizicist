import * as yup from "yup";
import customQuestionSchema from "./customQuestion.schema";

const questionSchema = customQuestionSchema.concat(
  yup.object({
    distractors: yup.array().of(
      yup.object({
        text: yup.string().required().label("Distractor text"),
        locked: yup.boolean().default(false).label("Distractor lock"),
      })
    ),
  })
);

export default questionSchema;
