import { Button, Checkbox, FormControl, FormLabel, Input, Text, Textarea } from "@chakra-ui/react";
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
            {props => (
                <Form>
                    <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>Create a quiz</Text>
                    <Field name="title">
                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                        {({ field }) => (
                            <FormControl>
                                <FormLabel>Quiz title</FormLabel>
                                <Input {...field} placeholder="CS50 Functions Quiz" />
                            </FormControl>
                        )}
                    </Field>
                    
                    <Field name="content">
                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                        {({ field }) => (
                            <FormControl>
                                <FormLabel>Content to quiz over</FormLabel>
                                <Textarea {...field} placeholder="Functions reduce duplicate code." />
                            </FormControl>
                        )}
                    </Field>

                    <Field name="is_markdown">
                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                        {({ field }) => (
                            <FormControl>
                                <FormLabel>Content is markdown</FormLabel>
                                <Checkbox {...field} />
                            </FormControl>
                        )}
                    </Field>
                    
                    <Button type="submit" isLoading={props.isSubmitting}>Create</Button>
                </Form>
            )}
        </Formik>
    );
};

export default Upload;
