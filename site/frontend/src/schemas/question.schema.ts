import { FeedbackTypes } from "@shared/feedback.type";
import * as yup from "yup";
import customQuestionSchema from "./customQuestion.schema";

const questionSchema = customQuestionSchema.concat(
  yup.object({
    answers: yup.array().of(
      yup.object({
        id: yup.number(),

        text: yup
          .string()
          .required()
          .label("Answer choice text"),

        user_feedback: yup
          .mixed<FeedbackTypes>()
          .oneOf(Object.values(FeedbackTypes) as number[])
          .required()
          .label("Feedback"),
      })
    ),
  })
);

export default questionSchema;
