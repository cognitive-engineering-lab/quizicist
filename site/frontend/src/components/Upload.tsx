import { Button, FormControl, FormHelperText, Text, useToast } from "@chakra-ui/react";
import uploadSchema, { CONTENT_TYPES } from "@schemas/upload.schema";
import { Formik, Form, FormikHelpers } from "formik";
import CheckboxField from "@components/fields/CheckboxField";
import SelectField from "@components/fields/SelectField";
import TextareaField from "@components/fields/TextareaField";
import TextField from "@components/fields/TextField";
import { useGenerationCreate } from "@hooks/mutation/mutationHooks";

const Upload: React.FC = () => {
    const createGeneration = useGenerationCreate();
    const toast = useToast();

    const upload = async (data: any, { resetForm }: FormikHelpers<any>) => {
        // request notification permission
        if (Notification.permission === "default") {
            toast({
                title: "Be notified when your quiz finishes generating",
                description: "If you allow notifications, we'll send you a message when your quiz is complete.",
                status: "info",
                duration: 9000,
                isClosable: true,
            });

            await Notification.requestPermission();
        }

        await createGeneration(data);
        resetForm();

        new Notification("Your quiz has finished generating.");
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
                        preventResize
                    />

                    <SelectField name="content_type" title="Content format" values={CONTENT_TYPES} />

                    <TextField name="count" title="Number of Questions" />

                    <CheckboxField name="is_custom_prompt" title="Use custom instructions" />

                    {props.values.is_custom_prompt && (
                        <TextareaField
                        name="custom_prompt"
                        title="Custom instructions"
                        placeholder="Include only questions about function parameters."
                        />
                    )}
                    
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
