import { Formik, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { Button, Divider } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";
import TextField from "@components/fields/TextField";
import LoadingIconButton from "@components/buttons/LoadingIconButton";
import { FeedbackTypes } from "@shared/feedback.type";

type QuestionProps = {
    question: Question;
    generation_id: number;
};

const QuestionView: React.FC<QuestionProps> = ({ question, generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;

    // update item content (question, answer choice text)
    const update = async (data: any) => {
        await api.post(`${API_URL}/question/${question.id}/update`, data);
        mutate(generation_url);
    }

    // delete item
    const del = async () => {
        await api.post(`${API_URL}/question/${question.id}/delete`);
        mutate(generation_url);
    }

    // send answer choice feedback (correct, incorrect) to server
    const feedback = async (answerIndex: number, value: FeedbackTypes) => {
        const answer = question.answers[answerIndex];

        // when clicking on current value, reset to neutral
        if (value === answer.user_feedback) {
            value = FeedbackTypes.unselected;
        }

        await api.post(`${API_URL}/question/${question.id}/feedback`, { answer: answer.id, value });
        mutate(generation_url);
    }

    const getFeedbackColor = (feedback: FeedbackTypes, button: "correct" | "incorrect") => {
        if (feedback === FeedbackTypes.incorrect && button === "incorrect") {
            return "red";
        }

        if (feedback === FeedbackTypes.correct && button === "correct") {
            return "green";
        }

        return "gray";
    }

    return (
        <Formik
            enableReinitialize
            initialValues={questionSchema.cast(question)}
            validationSchema={questionSchema}
            onSubmit={update}
        >
            {form => (
                <Form>
                    <TextField name="question" title="Question" placeholder="Your question" />

                    {form.values.answers?.map((answer, index) => (
                        <TextField
                            name={`answers.[${index}].text`}
                            title={`Answer ${index + 1}`}
                            placeholder="Answer choice"
                        >
                            <LoadingIconButton
                                size="sm"
                                className={styles.feedback}
                                colorScheme={getFeedbackColor(answer.user_feedback!, "correct")}
                                aria-label="This answer choice is correct"
                                icon={<CheckIcon />}
                                loadingFunction={() => feedback(index, FeedbackTypes.correct)}
                            />
                            <LoadingIconButton
                                size="sm"
                                className={styles.feedback}
                                colorScheme={getFeedbackColor(answer.user_feedback!, "incorrect")}
                                aria-label="This answer choice is incorrect"
                                icon={<CloseIcon />}
                                loadingFunction={() => feedback(index,FeedbackTypes.incorrect)}
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

                    <Button onClick={del} className={styles.button}>Delete Item</Button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
