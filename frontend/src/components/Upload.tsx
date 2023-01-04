import { Button, FormControl, FormHelperText, Text } from "@chakra-ui/react";
import uploadSchema from "@schemas/upload.schema";
import { Formik, Form, FormikHelpers } from "formik";
import CheckboxField from "@components/fields/CheckboxField";
import TextareaField from "@components/fields/TextareaField";
import TextField from "@components/fields/TextField";
import { useGenerationCreate } from "@hooks/mutation/mutationHooks";

const Upload: React.FC = () => {
    const createGeneration = useGenerationCreate();

    const upload = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await createGeneration(data);
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
                    
                    <Button type="submit" isLoading={props.isSubmitting}>Create quiz</Button>

                    {props.isSubmitting && 
                        <FormControl>
                            <FormHelperText>It may take a few minutes for questions to generate</FormHelperText>
                        </FormControl>
                    }
                </Form>
            )}
        </Formik>
    );
};

export default Upload;
