import { Button, Container, Radio, Text } from "@chakra-ui/react";
import TextareaField from "@components/fields/TextareaField";
import messageSchema from "@schemas/message.schema";
import api from "@shared/api";
import { API_URL } from "@shared/consts";
import { Formik, Form } from "formik";
import RadioField from "./fields/RadioField";

const MessageForm: React.FC = () => {
    const upload = async (data: any) => {
        await api.post(`${API_URL}/message/upload`, data);
    }

    return (
        <Container maxW="container.lg" pt="2em">
            <Formik
                initialValues={messageSchema.cast({})}
                validationSchema={messageSchema}
                onSubmit={upload}
            >
                {props => (
                    <Form>
                        <Text fontSize='2xl' style={{ marginBottom: "0.5em" }}>Give us your feedback!</Text>

                        <TextareaField
                            name="message"
                            title="Your feedback"
                            placeholder="I received an error creating a quiz."
                        />

                        <RadioField
                            name="message_type"
                            title="Feedback type"
                        >
                            <Radio value={0}>Error</Radio>
                            <br />
                            <Radio value={1}>Suggestion</Radio>
                            <br />
                            <Radio value={2}>Other</Radio>
                        </RadioField>
                        
                        <Button type="submit" isLoading={props.isSubmitting}>Submit feedback</Button>
                    </Form>
                )}
            </Formik>
        </Container>
    )
}

export default MessageForm;