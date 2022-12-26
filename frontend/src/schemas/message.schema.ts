import { MessageTypes } from "@shared/message.type";
import * as yup from "yup";

const messageSchema = yup.object({
    message: yup
        .string()
        .max(2500)
        .required()
        .label("Message")
        .default(""),

    message_type: yup
          .mixed<MessageTypes>()
          .oneOf(Object.values(MessageTypes) as number[])
          .required()
          .default(0) // default to error type
          .label("Message type"),
});

export default messageSchema;
