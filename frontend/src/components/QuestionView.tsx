import { Formik, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { Button, Divider, VStack } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";
import TextField from "@components/fields/TextField";
import LoadingButton from "@components/buttons/LoadingButton";
import { FeedbackTypes, getNewFeedback } from "@shared/feedback.type";
import _ from "lodash";
import { useAnswerChoiceAdd, useQuestionDelete, useQuestionUpdate } from "@hooks/mutation/mutationHooks";
import { deleteAnswerOptimistic, deleteQuestionOptimistic } from "@hooks/mutation/optimisticData";
import Generation from "@shared/generation.type";

type QuestionProps = {
    question: Question;
    generation: Generation;
};

const QuestionView: React.FC<QuestionProps> = ({ question, generation }) => {
    const generation_url = `${API_URL}/generated/${generation.id}`;

    const updateQuestion = useQuestionUpdate(generation.id, question.id);

    const deleteQuestion = useQuestionDelete(
        generation.id,
        question.id,
        { optimisticData: () => deleteQuestionOptimistic(generation, question.id) }
    );

    const addAnswerChoices = useAnswerChoiceAdd(generation.id, question.id);

    const deleteAnswerChoice = async (id: number) => {
        // prevent loading by adding optimistic data
        const optimisticData = deleteAnswerOptimistic(generation, question.id, id);

        await api.post(`${API_URL}/question/${question.id}/${id}/delete`);
        mutate(generation_url, optimisticData);
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
            return "yellow";
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
            onSubmit={updateQuestion}
        >
            {form => (
                <Form>
                    <VStack spacing={8}>
                        <TextField
                            name="question"
                            title="Question"
                            placeholder="Your question"
                            submitOnBlur
                            labelProps={{
                                fontSize: "lg",
                            }}
                        />

                        {form.values.answers?.map((answer, index) => (
                            <TextField
                                name={`answers.[${index}].text`}
                                title={`Answer ${index + 1}`}
                                placeholder="Answer choice"
                                submitOnBlur
                                labelProps={{
                                    fontSize: "lg",
                                    display: "flex",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <div className={styles.feedback}>
                                    <LoadingButton
                                        size="xs"
                                        className={styles.feedback}
                                        colorScheme={getFeedbackColor(answer.user_feedback!, "correct")}
                                        aria-label="This answer choice is correct"
                                        loadingFunction={() => addFeedback(index, FeedbackTypes.correct)}
                                        optimisticProps={{
                                            // TODO: clean up reuse of color scheme calls
                                            colorScheme: getFeedbackColor(getNewFeedback(answer.user_feedback!, FeedbackTypes.correct), "correct")
                                        }}
                                    >
                                        <CheckIcon style={{ marginRight: "0.5em" }} />{" "}Correct
                                    </LoadingButton>

                                    <LoadingButton
                                        size="xs"
                                        className={styles.feedback}
                                        colorScheme={getFeedbackColor(answer.user_feedback!, "incorrect")}
                                        aria-label="This answer choice is incorrect"
                                        loadingFunction={() => addFeedback(index,FeedbackTypes.incorrect)}
                                        optimisticProps={{
                                            // TODO: clean up reuse of color scheme calls
                                            colorScheme: getFeedbackColor(getNewFeedback(answer.user_feedback!, FeedbackTypes.incorrect), "incorrect")
                                        }}
                                    >
                                        <CloseIcon style={{ marginRight: "0.5em" }} />{" "}Incorrect
                                    </LoadingButton>

                                    <Button
                                        size="xs"
                                        className={styles.feedback}
                                        aria-label="Delete this answer choice"
                                        colorScheme="red"
                                        onClick={() => deleteAnswerChoice(answer.id!)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </TextField>
                        ))}
                    </VStack>

                    <Divider className={styles.divider} />

                    <LoadingButton loadingFunction={addAnswerChoices} className={styles.button}>Add answer choices</LoadingButton>
                    <Button onClick={deleteQuestion} className={styles.button}>Delete Item</Button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
