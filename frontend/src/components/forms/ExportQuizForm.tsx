import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Link } from "@chakra-ui/react";
import exportToFormsSchema from "@schemas/exportToForms.schema";
import api from "@shared/api";
import { API_URL } from "@shared/consts";
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
    
    // find all questions with unanswered choices
    const unscored = _.filter(
        generation.questions,
        q => _.filter(q.answers, { user_feedback: FeedbackTypes.unselected }).length > 0
    );

    return (
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
    )
}

export default ExportQuizForm;
