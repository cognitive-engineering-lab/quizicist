import { Formik, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { Button, Divider } from "@chakra-ui/react";
import { LockIcon, UnlockIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";
import TextField from "@components/fields/TextField";
import IconCheckbox from "@components/fields/IconCheckbox";

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

    return (
        <Formik
            enableReinitialize
            initialValues={questionSchema.cast(question)}
            validationSchema={questionSchema}
            onSubmit={update}
        >
            {props => (
                <Form>
                    <TextField name="question" title="Question" placeholder="Your question" />
                    <TextField name="correct_answer" title="Correct answer" placeholder="Correct answer to your question" />

                    {props.values.distractors?.map((_, index) => (
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

                    <Button disabled={!props.dirty} onClick={props.submitForm} className={styles.button}>Update</Button>
                    <Button disabled={props.dirty} onClick={reroll} className={styles.button}>Reroll Distractors</Button>
                    <Button onClick={del} className={styles.button}>Delete Item</Button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
