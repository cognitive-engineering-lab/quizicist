import axios from "axios";
import { Formik, Field, Form } from "formik";
import useSWR, { mutate } from "swr";
import { fetcher } from "@hooks/fetcher";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { ALL_GENERATIONS_URL, SERVER_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";
import { DeleteIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, FormControl, FormLabel, IconButton, Input, Text } from "@chakra-ui/react";
import styles from "./GenerationView.module.css";

type GenerationProps = {
    generation_id: number;
};

const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const generation_url = `${SERVER_URL}/generated/${generation_id}`;
    const { data: generation } = useSWR<Generation>(generation_url, fetcher);

    const create = async (data: any) => {
        await axios.post(`${SERVER_URL}/generated/${generation_id}/new`, data);
        mutate(generation_url);
    }

    const del = async () => {
        await axios.post(`${SERVER_URL}/generated/${generation_id}/delete`);
        mutate(ALL_GENERATIONS_URL);
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
                                        <FormControl>
                                            <FormLabel>Question</FormLabel>
                                            <Input {...field} placeholder="question" />
                                        </FormControl>
                                    )}
                                </Field>

                                <Field name="correct_answer">
                                    {/* @ts-ignore TODO: hacky fix before creating custom component */}
                                    {({ field }) => (
                                        <FormControl>
                                            <FormLabel>Correct answer</FormLabel>
                                            <Input {...field} placeholder="correct_answer" />
                                        </FormControl>
                                    )}
                                </Field>
                                
                                <Button type="submit">Create</Button>
                            </Form>
                        </Formik>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
            <br />
        </div>
    )
}

export default GenerationView;
