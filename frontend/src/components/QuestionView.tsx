import { Formik, Field, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "@schemas/question.schema";
import { API_URL } from "@shared/consts";
import Question from "@shared/question.type"
import { FormControl, FormLabel, Input, IconButton, Button, Divider } from "@chakra-ui/react";
import { LockIcon, UnlockIcon } from "@chakra-ui/icons";
import styles from "./QuestionView.module.css";
import api from "@shared/api";

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
                    <Field name="question">
                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                        {({ field }) => (
                            <FormControl>
                                <FormLabel>Question</FormLabel>
                                <Input {...field} placeholder="question" />
                            </FormControl>
                        )}
                    </Field>

                    <Field name="correct_answer">
                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                        {({ field }) => (
                            <FormControl className={styles.field}>
                                <FormLabel>Correct answer</FormLabel>
                                <Input {...field} placeholder="correct_answer" />
                            </FormControl>
                        )}
                    </Field>

                    {props.values.distractors?.map((_, index) => (
                        <>
                            <Field name={`distractors.[${index}].text`}>
                                {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                {({ field }) => (
                                    <FormControl className={styles.field}>
                                        <FormLabel>
                                            Distractor {index + 1}
                                            <Field
                                                name={`distractors.[${index}].locked`}
                                                type="checkbox"
                                            >
                                                {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                                {({ field, form }) => (
                                                    <IconButton
                                                        size="sm"
                                                        className={styles.lock}
                                                        aria-label="Lock/unlock distractor"
                                                        icon={field.value ? <LockIcon /> : <UnlockIcon />}
                                                        onClick={() => form.setFieldValue(`distractors.[${index}].locked`, !field.value)}
                                                    />
                                                )}
                                            </Field>
                                        </FormLabel>
                                        <Input {...field} placeholder='name' />
                                    </FormControl>
                                )}
                            </Field>
                        </>
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
