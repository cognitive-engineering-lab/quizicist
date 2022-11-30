import uploadSchema from "@schemas/upload.schema";
import { ALL_GENERATIONS_URL, SERVER_URL } from "@shared/consts";
import axios from "axios";
import { Formik, Field, Form, FormikHelpers } from "formik";
import { mutate } from "swr";

const Upload: React.FC = () => {
    const upload = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await axios.post(`${SERVER_URL}/upload`, data);
        mutate(ALL_GENERATIONS_URL);
        resetForm();
    }

    return (
        <Formik
            initialValues={uploadSchema.cast({})}
            validationSchema={uploadSchema}
            onSubmit={upload}
        >
            <Form>
                <label>Quiz name:</label>
                <Field name="title" type="text" />
                
                <label>Content to quiz over:</label>
                <Field name="content" type="text" as="textarea" />

                <label>Is markdown:</label>
                <Field name="is_markdown" type="checkbox" />
                
                <button type="submit">Create</button>
            </Form>
        </Formik>
    );
};

export default Upload;
