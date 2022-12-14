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
import { FeedbackTypes, getNewFeedback } from "@shared/feedback.type";
import Generation from "@shared/generation.type";
import _ from "lodash";

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
        // prevent loading by adding optimistic data
        const optimisticData = (current: Generation): Generation => {
            // remove current question from quiz data
            _.remove(current.questions, (q) => q.id === question.id);

            return current;
        }

        await api.post(`${API_URL}/question/${question.id}/delete`);
        mutate(generation_url, null, { optimisticData });
    }

    // send answer choice feedback (correct, incorrect) to server
    const addFeedback = async (answerIndex: number, feedback: FeedbackTypes) => {
        const answer = question.answers[answerIndex];
        const value = getNewFeedback(answer.user_feedback, feedback);

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
                    <TextField
                        name="question"
                        title="Question"
                        placeholder="Your question"
                        submitOnBlur
                    />

                    {form.values.answers?.map((answer, index) => (
                        <TextField
                            name={`answers.[${index}].text`}
                            title={`Answer ${index + 1}`}
                            placeholder="Answer choice"
                            submitOnBlur
                        >
                            <LoadingIconButton
                                size="sm"
                                className={styles.feedback}
                                colorScheme={getFeedbackColor(answer.user_feedback!, "correct")}
                                aria-label="This answer choice is correct"
                                icon={<CheckIcon />}
                                loadingFunction={() => addFeedback(index, FeedbackTypes.correct)}
                                optimisticProps={{
                                    // TODO: clean up reuse of color scheme calls
                                    colorScheme: getFeedbackColor(getNewFeedback(answer.user_feedback!, FeedbackTypes.correct), "correct")
                                }}
                            />
                            <LoadingIconButton
                                size="sm"
                                className={styles.feedback}
                                colorScheme={getFeedbackColor(answer.user_feedback!, "incorrect")}
                                aria-label="This answer choice is incorrect"
                                icon={<CloseIcon />}
                                loadingFunction={() => addFeedback(index,FeedbackTypes.incorrect)}
                                optimisticProps={{
                                    // TODO: clean up reuse of color scheme calls
                                    colorScheme: getFeedbackColor(getNewFeedback(answer.user_feedback!, FeedbackTypes.incorrect), "incorrect")
                                }}
                            />
                        </TextField>
                    ))}

                    <Divider className={styles.divider} />

                    <Button onClick={del} className={styles.button}>Delete Item</Button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
