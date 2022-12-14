import { Formik, Form, FormikHelpers } from "formik";
import useSWR, { mutate } from "swr";
import { fetcher } from "@hooks/fetcher";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { ALL_GENERATIONS_URL, API_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";
import { DeleteIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Text } from "@chakra-ui/react";
import styles from "./GenerationView.module.css";
import api from "@shared/api";
import exportToFormsSchema from "@schemas/exportToForms.schema";
import TextField from "@components/fields/TextField";
import LoadingIconButton from "./buttons/LoadingIconButton";
import addQuestionsSchema from "@schemas/addQuestions.schema";

type GenerationProps = {
    generation_id: number;
};

const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;
    const { data: generation } = useSWR<Generation>(generation_url, fetcher);

    const create = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await api.post(`${API_URL}/generated/${generation_id}/new`, data);
    
        resetForm();
        mutate(generation_url);
    }

    const del = async () => {
        await api.post(`${API_URL}/generated/${generation_id}/delete`);
        mutate(ALL_GENERATIONS_URL);
    }

    const addQuestions = async (data: any) => {
        await api.post(`${API_URL}/generated/${generation_id}/more`, data);
        mutate(generation_url);
    }

    const exportToForms = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await api.post(`${API_URL}/generated/${generation_id}/google_form`, data);

        resetForm();
    }

    if (!generation) {
        return <div>Loading generation...</div>
    }

    return (
        <div style={{ marginBottom: "2em" }}>
            <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>
                {generation.filename}
                <LoadingIconButton
                    size="sm"
                    className={styles.remove}
                    aria-label="Delete quiz"
                    icon={<DeleteIcon color="red.500" />}
                    loadingFunction={del}
                />
            </Text>
            <Accordion allowToggle>
                {generation.questions.map((q, i) => (
                    <AccordionItem>
                        <h2>
                            <AccordionButton>
                                <Box flex='1' textAlign='left'>
                                    <b>Question {i + 1}:</b> {q.question}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <QuestionView key={q.id} question={q} generation_id={generation.id} />
                        </AccordionPanel>
                    </AccordionItem>
                ))}

                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                <b>Generate more questions</b>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <Formik
                            enableReinitialize
                            initialValues={addQuestionsSchema.cast({})}
                            validationSchema={addQuestionsSchema}
                            onSubmit={addQuestions}
                        >
                            {(form) => (
                                <Form>
                                    <TextField name="count" title="Number of Questions" />
                                    <Button type="submit" isLoading={form.isSubmitting}>Generate questions</Button>
                                </Form>
                            )}
                        </Formik>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                <b>Create custom question</b>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <Formik
                            initialValues={customQuestionSchema.cast({})}
                            validationSchema={customQuestionSchema}
                            onSubmit={create}
                        >
                            {(form) => (
                                <Form>
                                    <TextField
                                        name="question"
                                        title="Question"
                                        placeholder="Which JavaScript keyword is used to declare a constant?"
                                    />
                                    
                                    <Button type="submit" isLoading={form.isSubmitting}>Create</Button>
                                </Form>
                            )}
                        </Formik>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                <b>Export to Google Forms</b>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <Formik
                            enableReinitialize
                            initialValues={exportToFormsSchema.cast({})}
                            validationSchema={exportToFormsSchema}
                            onSubmit={exportToForms}
                        >
                            {(form) => (
                                <Form>
                                    <TextField name="email" title="Email" placeholder="email@example.com" />
                                    <Button type="submit" isLoading={form.isSubmitting}>Export</Button>
                                </Form>
                            )}
                        </Formik>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
            <br />
        </div>
    )
}

export default GenerationView;
