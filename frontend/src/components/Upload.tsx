import { Button, Text } from "@chakra-ui/react";
import uploadSchema from "@schemas/upload.schema";
import api from "@shared/api";
import { ALL_GENERATIONS_URL, API_URL } from "@shared/consts";
import { Formik, Form, FormikHelpers } from "formik";
import { mutate } from "swr";
import CheckboxField from "@components/fields/CheckboxField";
import TextareaField from "@components/fields/TextareaField";
import TextField from "@components/fields/TextField";

const Upload: React.FC = () => {
    const upload = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await api.post(`${API_URL}/upload`, data);
        mutate(ALL_GENERATIONS_URL);
        resetForm();
    }

    return (
        <Formik
            initialValues={uploadSchema.cast({})}
            validationSchema={uploadSchema}
            onSubmit={upload}
        >
            {props => (
                <Form>
                    <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>Create a quiz</Text>
                    <TextField
                        name="title"
                        title="Quiz title"
                        placeholder="CS50 Functions Quiz"
                    />

                    <TextareaField
                        name="content"
                        title="Content to quiz over"
                        placeholder="Functions reduce duplicate code."
                    />

                    <CheckboxField
                        name="is_markdown"
                        title="Content is markdown"
                    />
                    
                    <Button type="submit" isLoading={props.isSubmitting}>Create</Button>
                </Form>
            )}
        </Formik>
    );
};

export default Upload;
