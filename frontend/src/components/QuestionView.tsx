import { Formik, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { Button, Divider } from "@chakra-ui/react";
import { LockIcon, TriangleDownIcon, TriangleUpIcon, UnlockIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";
import TextField from "@components/fields/TextField";
import IconCheckbox from "@components/fields/IconCheckbox";
import LoadingIconButton from "@components/buttons/LoadingIconButton";
import { FeedbackTypes } from "@shared/feedback.type";

type QuestionProps = {
    question: Question;
    generation_id: number;
};

const QuestionView: React.FC<QuestionProps> = ({ question, generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;

    const reroll = async () => {
        await api.post(`${API_URL}/question/${question.id}/reroll`);
        mutate(generation_url);
    }

    const update = async (data: any) => {
        await api.post(`${API_URL}/question/${question.id}/update`, data);
        mutate(generation_url);
    }

    const del = async () => {
        await api.post(`${API_URL}/question/${question.id}/delete`);
        mutate(generation_url);
    }

    const feedback = async (value: FeedbackTypes) => {
        // when clicking on current value, reset to neutral
        if (value === question.feedback?.value) {
            value = FeedbackTypes.neutral;
        }

        await api.post(`${API_URL}/question/${question.id}/feedback`, { value });
        mutate(generation_url);
    }

    const positiveColorScheme = question.feedback?.value === FeedbackTypes.positive ? "green" : "gray";
    const negativeColorScheme = question.feedback?.value === FeedbackTypes.negative ? "red" : "gray"

    return (
        <Formik
            enableReinitialize
            initialValues={questionSchema.cast(question)}
            validationSchema={questionSchema}
            onSubmit={update}
        >
            {form => (
                <Form>
                    <TextField name="question" title="Question" placeholder="Your question">
                        <LoadingIconButton
                            size="sm"
                            className={styles.feedback}
                            colorScheme={positiveColorScheme}
                            aria-label="This generated question is high quality"
                            icon={<TriangleUpIcon />}
                            loadingFunction={() => feedback(FeedbackTypes.positive)}
                        />
                        <LoadingIconButton
                            size="sm"
                            className={styles.feedback}
                            colorScheme={negativeColorScheme}
                            aria-label="This generated question is low quality"
                            icon={<TriangleDownIcon />}
                            loadingFunction={() => feedback(FeedbackTypes.negative)}
                        />
                    </TextField>

                    <TextField name="correct_answer" title="Correct answer" placeholder="Correct answer to your question" />

                    {form.values.distractors?.map((_, index) => (
                        <TextField
                            name={`distractors.[${index}].text`}
                            title={`Distractor ${index + 1}`}
                            placeholder="Distractor answer"
                        >
                            <IconCheckbox
                                name={`distractors.[${index}].locked`}
                                label="Lock/unlock distractor"
                                iconWhenChecked={<LockIcon />}
                                iconWhenNot={<UnlockIcon />}
                            />
                        </TextField>
                    ))}

                    <Divider className={styles.divider} />

                    <Button
                        disabled={!form.dirty}
                        onClick={form.submitForm}
                        className={styles.button}
                        isLoading={form.isSubmitting}
                    >
                        Update
                    </Button>

                    <Button disabled={form.dirty} onClick={reroll} className={styles.button}>Reroll Distractors</Button>
                    <Button onClick={del} className={styles.button}>Delete Item</Button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
