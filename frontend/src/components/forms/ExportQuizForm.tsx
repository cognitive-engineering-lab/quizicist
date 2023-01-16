import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Link, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import exportToFormsSchema from "@schemas/exportToForms.schema";
import api from "@shared/api";
import { API_URL, SERVER_URL } from "@shared/consts";
import { FeedbackTypes } from "@shared/feedback.type";
import { Formik, Form } from "formik";
import _ from "lodash";
import TextField from "../fields/TextField";
import { QuizUtilFormProps } from "./shared";

const ExportQuizForm: React.FC<QuizUtilFormProps> = ({ generation, setPanel, onClose }) => {
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

    const downloadTOML = () => {
        const url = `${SERVER_URL}${API_URL}/generated/${generation.id}/toml`

        // programmatically create link with href of TOML file
        const a = document.createElement("a");
        a.href = url;
        a.setAttribute("download", url);
        a.click();

        a.remove();
    }
    
    // find all questions with unanswered choices
    const unscored = _.filter(
        generation.questions,
        q => _.filter(q.answers, { user_feedback: FeedbackTypes.unselected }).length > 0
    );

    return (
        <Tabs variant='enclosed'>
            <TabList>
                <Tab>Google Forms</Tab>
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
                    <Button onClick={downloadTOML} mt="1em">Download mdbook-quiz TOML</Button>
                </TabPanel>
            </TabPanels>
            </Tabs>
    )
}

export default ExportQuizForm;
