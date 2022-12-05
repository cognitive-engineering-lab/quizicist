import * as yup from "yup";

const exportToFormsSchema = yup.object({
    email: yup.string().email().required().default("").label("Export email"),
});

export default exportToFormsSchema;
