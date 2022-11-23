import axios from "axios";
import { Formik, Field, Form } from "formik";
import { mutate } from "swr";
import questionSchema from "../schemas/question.schema";
import { SERVER_URL } from "../shared/consts";
import Question from "../shared/question.type"

type QuestionProps = {
    question: Question;
    generation_id: number;
};

const QuestionView: React.FC<QuestionProps> = ({ question, generation_id }) => {
    const generation_url = `${SERVER_URL}/generated/${generation_id}`;

    const reroll = async () => {
        await axios.post(`${SERVER_URL}/question/${question.id}/reroll`);
        mutate(generation_url);
    }

    const update = async (data: any) => {
        await axios.post(`${SERVER_URL}/question/${question.id}/update`, data);
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
                    <label>Question:</label>
                    <Field name="question" type="text" />

                    <label>Correct answer:</label>
                    <Field name="correct_answer" type="text" />

                    <label>Distractor 1:</label>
                    <Field name="option1" type="text" />

                    <label>Distractor 2:</label>
                    <Field name="option2" type="text" />

                    <label>Distractor 3:</label>
                    <Field name="option3" type="text" />

                    <button disabled={!props.dirty} type="submit">Update</button>
                    <button disabled={props.dirty} onClick={reroll}>Reroll Distractors</button>
                </Form>
            )}
        </Formik>
    )
}

export default QuestionView;
