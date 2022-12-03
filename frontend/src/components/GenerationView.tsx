import { Formik, Field, Form } from "formik";
import useSWR, { mutate } from "swr";
import { fetcher } from "@hooks/fetcher";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { ALL_GENERATIONS_URL, API_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";
import { DeleteIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, FormControl, FormLabel, IconButton, Input, Text } from "@chakra-ui/react";
import styles from "./GenerationView.module.css";
import api from "@shared/api";
import exportToFormsSchema from "@schemas/exportToForms.schema";

type GenerationProps = {
    generation_id: number;
};

const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;
    const { data: generation } = useSWR<Generation>(generation_url, fetcher);

    const create = async (data: any) => {
        await api.post(`${API_URL}/generated/${generation_id}/new`, data);
        mutate(generation_url);
    }

    const del = async () => {
        await api.post(`${API_URL}/generated/${generation_id}/delete`);
        mutate(ALL_GENERATIONS_URL);
    }

    const exportToForms = async (data: any) => {
        await api.post(`${API_URL}/generated/${generation_id}/google_form`, data);
    }

    if (!generation) {
        return <div>Loading generation...</div>
    }

    return (
        <div style={{ marginBottom: "2em" }}>
            <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>
                {generation.filename}
                <IconButton
                    size="sm"
                    className={styles.remove}
                    aria-label="Delete quiz"
                    icon={<DeleteIcon color="red.500" />}
                    onClick={del}
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
                                <b>Create custom question</b>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <Formik
                            enableReinitialize
                            initialValues={customQuestionSchema.cast({})}
                            validationSchema={customQuestionSchema}
                            onSubmit={create}
                        >
                            <Form>
                                <Field name="question">
                                    {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                    {({ field }) => (
                                        <FormControl className={styles.field}>
                                            <FormLabel>Question</FormLabel>
                                            <Input {...field} placeholder="Which JavaScript keyword is used to declare a constant?" />
                                        </FormControl>
                                    )}
                                </Field>

                                <Field name="correct_answer">
                                    {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                    {({ field }) => (
                                        <FormControl className={styles.field}>
                                            <FormLabel>Correct answer</FormLabel>
                                            <Input {...field} placeholder="const" />
                                        </FormControl>
                                    )}
                                </Field>
                                
                                <Button type="submit">Create</Button>
                            </Form>
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
                                    <Field name="email">
                                        {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                        {({ field }) => (
                                            <FormControl className={styles.field}>
                                                <FormLabel>Email</FormLabel>
                                                <Input {...field} placeholder="email@example.com" />
                                            </FormControl>
                                        )}
                                    </Field>
                                    
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
