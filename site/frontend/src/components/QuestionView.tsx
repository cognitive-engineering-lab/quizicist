import { Formik, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { Button, Divider, VStack } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";
import TextareaField from "@components/fields/TextareaField";
import LoadingButton from "@components/buttons/LoadingButton";
import { FeedbackTypes } from "@shared/feedback.type";
import _ from "lodash";
import { useAnswerChoiceAdd, useFeedbackAdd, useQuestionDelete, useQuestionUpdate } from "@hooks/mutation/mutationHooks";
import { deleteAnswerOptimistic } from "@hooks/mutation/optimisticData";
import Generation from "@shared/generation.type";

type QuestionProps = {
    question: Question;
    generation: Generation;
};

const QuestionView: React.FC<QuestionProps> = ({ question, generation }) => {
    const generation_url = `${API_URL}/generated/${generation.id}`;

    const updateQuestion = useQuestionUpdate(generation.id, question.id);
    const deleteQuestion = useQuestionDelete(generation, question.id);
    const addAnswerChoices = useAnswerChoiceAdd(generation.id, question.id);
    const addFeedback = useFeedbackAdd(generation, question.id);

    const deleteAnswerChoice = async (id: number) => {
        // prevent loading by adding optimistic data
        const optimisticData = deleteAnswerOptimistic(generation, question.id, id);

        await api.post(`${API_URL}/question/${question.id}/${id}/delete`);
        mutate(generation_url, optimisticData);
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

    // remove deleted answer choices
    _.remove(question.answers, (a) => a.deleted);

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
                        <TextareaField
                            name="question"
                            title="Question"
                            placeholder="Your question"
                            submitOnBlur
                            labelProps={{
                                fontSize: "lg",
                                display: "flex",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <div className={styles.feedback}>
                                <Button
                                    size="sm"
                                    height="2em"
                                    width="5em"
                                    className={styles.feedback}
                                    aria-label="Delete question"
                                    colorScheme="red"
                                    onClick={deleteQuestion}
                                >
                                    Delete
                                </Button>
                            </div>
                        </TextareaField>

                        {form.values.answers?.map((answer, index) => (
                            <TextareaField
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
                                    <Button
                                        size="xs"
                                        className={styles.feedback}
                                        colorScheme={getFeedbackColor(answer.user_feedback!, "correct")}
                                        aria-label="This answer choice is correct"
                                        onClick={() => addFeedback(question.answers[index], FeedbackTypes.correct)}
                                    >
                                        <CheckIcon style={{ marginRight: "0.5em" }} />{" "}Correct
                                    </Button>

                                    <Button
                                        size="xs"
                                        className={styles.feedback}
                                        colorScheme={getFeedbackColor(answer.user_feedback!, "incorrect")}
                                        aria-label="This answer choice is incorrect"
                                        onClick={() => addFeedback(question.answers[index], FeedbackTypes.incorrect)}
                                    >
                                        <CloseIcon style={{ marginRight: "0.5em" }} />{" "}Incorrect
                                    </Button>

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
                            </TextareaField>
                        ))}
                    </VStack>

                    <Divider className={styles.divider} />

                    <LoadingButton loadingFunction={addAnswerChoices} className={styles.button}>Add answer choices</LoadingButton>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
