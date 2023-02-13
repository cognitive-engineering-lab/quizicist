import { Button } from "@chakra-ui/react";
import { useCustomQuestion } from "@hooks/mutation/mutationHooks";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { Formik, Form } from "formik";
import TextField from "../fields/TextField";
import { QuizUtilFormProps } from "./shared";

const CustomQuestionForm: React.FC<QuizUtilFormProps> = ({ generation, onClose }) => {
    const createCustomQuestion = useCustomQuestion(generation.id);

    const submit = async (data: any) => {
        await createCustomQuestion(data);
        onClose();
    }

    return (
        <Formik
            initialValues={customQuestionSchema.cast({})}
            validationSchema={customQuestionSchema}
            onSubmit={submit}
        >
            {(form) => (
                <Form>
                    <TextField
                        name="question"
                        title="Question"
                        placeholder="Which JavaScript keyword is used to declare a constant?"
                    />
                    
                    <Button type="submit" isLoading={form.isSubmitting}>Create question</Button>
                </Form>
            )}
        </Formik>
    )
}

export default CustomQuestionForm;
