import { Formik, Form, FormikHelpers } from "formik";
import useSWR from "swr";
import { fetcher } from "@hooks/fetcher";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { API_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";
import { DeleteIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Editable, EditableInput, EditablePreview, ExpandedIndex, Link, Text } from "@chakra-ui/react";
import styles from "./GenerationView.module.css";
import api from "@shared/api";
import exportToFormsSchema from "@schemas/exportToForms.schema";
import TextField from "@components/fields/TextField";
import LoadingIconButton from "./buttons/LoadingIconButton";
import addQuestionsSchema from "@schemas/addQuestions.schema";
import _ from "lodash";
import { FeedbackTypes } from "@shared/feedback.type";
import { useState } from "react";
import { useCustomQuestion, useGenerationDelete, useGenerationUpdate, useQuestionAdd } from "@hooks/mutation/mutationHooks";

type GenerationProps = {
    generation_id: number;
};

const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;
    const { data: generation } = useSWR<Generation>(generation_url, fetcher);
    const [panel, setPanel] = useState<ExpandedIndex>(-1);

    const deleteGeneration = useGenerationDelete(generation_id);
    const addQuestions = useQuestionAdd(generation_id);
    const updateGeneration = useGenerationUpdate(generation_id);
    const createCustomQuestion = useCustomQuestion(generation_id);

    const create = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await createCustomQuestion(data);
        resetForm();
    }

    const exportToForms = async (data: any, { resetForm }: FormikHelpers<any>) => {
        await api.post(`${API_URL}/generated/${generation_id}/google_form`, data);

        resetForm();
    }

    if (!generation) {
        return <div>Loading generation...</div>
    }

    const getQuestionPosition = (id: number) => {
        return _.findIndex(generation.questions, { id });
    }

    // find all questions with unanswered choices
    const unscored = _.filter(
        generation.questions,
        q => _.filter(q.answers, { user_feedback: FeedbackTypes.unselected }).length > 0
    );

    // remove deleted questions
    _.remove(generation.questions, (q) => q.deleted);

    return (
        <div style={{ marginBottom: "2em" }}>
            <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>
                <Editable
                    display="inline-block"
                    defaultValue={generation.filename}
                    onSubmit={(filename) => updateGeneration({ filename })}
                >
                    <EditablePreview />
                    <EditableInput />
                </Editable>

                <LoadingIconButton
                    size="sm"
                    className={styles.remove}
                    aria-label="Delete quiz"
                    icon={<DeleteIcon color="red.500" />}
                    loadingFunction={deleteGeneration}
                />
            </Text>
            <Accordion allowToggle onChange={setPanel} index={panel}>
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
                            <QuestionView key={q.id} question={q} generation={generation} />
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
                                    
                                    <Button type="submit" isLoading={form.isSubmitting}>Create question</Button>
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
                                    {!!unscored.length && 
                                        // if some answers are unscored, display alert
                                        <Alert
                                            status="error"
                                            style={{ marginBottom: "1em" }}
                                        >
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle>All answer choices must be scored</AlertTitle>
                                                <AlertDescription>
                                                    Please assign either <code>correct</code> or <code>incorrect</code> to all answer choices in the following questions:
                                                    
                                                    {unscored.map(q => 
                                                        <div style={{ marginLeft: "1em" }}>
                                                            <Link onClick={() => setPanel(getQuestionPosition(q.id))}>
                                                                Question {getQuestionPosition(q.id)! + 1}
                                                            </Link>
                                                        </div>
                                                    )}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    }
                                    <TextField name="email" title="Email" placeholder="email@example.com" />
                                    <Button
                                        type="submit"
                                        isLoading={form.isSubmitting}
                                        disabled={!!unscored.length}
                                    >
                                        Export
                                    </Button>
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
