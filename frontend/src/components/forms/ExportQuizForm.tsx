import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Link, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import ExportTextbox from "@components/ExportTextbox";
import { fetcher } from "@hooks/fetcher";
import exportToFormsSchema from "@schemas/exportToForms.schema";
import api from "@shared/api";
import { API_URL } from "@shared/consts";
import { FeedbackTypes } from "@shared/feedback.type";
import { Formik, Form } from "formik";
import _ from "lodash";
import useSWR from "swr";
import TextField from "../fields/TextField";
import { QuizUtilFormProps } from "./shared";

const ExportQuizForm: React.FC<QuizUtilFormProps> = ({ generation, setPanel, onClose }) => {
    const { data: toml } = useSWR<string>(`${API_URL}/generated/${generation.id}/toml`, fetcher);

    const submit = async (data: any) => {
        await api.post(`${API_URL}/generated/${generation.id}/google_form`, data);
        onClose();
    }

    // open accordion panel for question
    const openQuestion = (questionId: number) => {
        setPanel(getQuestionPosition(questionId));
        onClose();
    }

    const getQuestionPosition = (id: number) => {
        return _.findIndex(generation.questions, { id });
    }
    
    // find all questions with unanswered choices
    const unscored = _.filter(
        generation.questions,
        q => _.filter(q.answers, { user_feedback: FeedbackTypes.unselected }).length > 0
    );

    // represent quiz questions as plain text
    const plainText = generation.questions
        .filter(q => !q.deleted)
        .map(q => {
            const question = q.question;
            const answers = q.answers
                .filter(a => !a.deleted)
                .map(a => {
                    const letter = String.fromCharCode(97 + a.position);

                    return `    ${letter}: ${a.text}`
                })

            return `Question: ${question}\n${answers.join("\n")}\n`;
    });

    return (
        <Tabs variant='enclosed'>
            <TabList>
                <Tab>Google Forms</Tab>
                <Tab>Plain text</Tab>
                <Tab>mdbook-quiz</Tab>
            </TabList>
            <TabPanels>
                <TabPanel>
                    <Formik
                        enableReinitialize
                        initialValues={exportToFormsSchema.cast({})}
                        validationSchema={exportToFormsSchema}
                        onSubmit={submit}
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
                                                        <Link onClick={() => openQuestion(q.id)}>
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
                </TabPanel>
                <TabPanel>
                    <ExportTextbox value={plainText.join("\n")} />
                </TabPanel>
                <TabPanel>
                    {toml && <ExportTextbox value={toml} />}
                </TabPanel>
            </TabPanels>
            </Tabs>
    )
}

export default ExportQuizForm;
