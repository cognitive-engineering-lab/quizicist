import * as yup from "yup";

const exportToFormsSchema = yup.object({
    email: yup.string().email().required(),
});

export default exportToFormsSchema;
