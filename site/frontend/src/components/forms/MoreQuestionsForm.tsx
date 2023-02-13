import { Button } from "@chakra-ui/react";
import { useQuestionAdd } from "@hooks/mutation/mutationHooks";
import addQuestionsSchema from "@schemas/addQuestions.schema";
import { Formik, Form } from "formik";
import TextField from "../fields/TextField";
import { QuizUtilFormProps } from "./shared";

const MoreQuestionsForm: React.FC<QuizUtilFormProps> = ({ generation, onClose }) => {
    const addQuestions = useQuestionAdd(generation.id);

    const submit = async (data: any) => {
        await addQuestions(data);
        onClose();
    }

    return (
        <Formik
            enableReinitialize
            initialValues={addQuestionsSchema.cast({})}
            validationSchema={addQuestionsSchema}
            onSubmit={submit}
        >
            {(form) => (
                <Form>
                    <TextField name="count" title="Number of Questions" />
                    <Button type="submit" isLoading={form.isSubmitting}>Generate questions</Button>
                </Form>
            )}
        </Formik>
    )
}

export default MoreQuestionsForm;
