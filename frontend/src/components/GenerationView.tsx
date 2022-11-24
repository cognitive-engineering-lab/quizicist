import axios from "axios";
import { Formik, Field, Form } from "formik";
import useSWR, { mutate } from "swr";
import { fetcher } from "@hooks/fetcher";
import customQuestionSchema from "@schemas/customQuestion.schema";
import { SERVER_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";

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

    if (!generation) {
        return <div>Loading generation...</div>
    }

    return (
        <div>
            <h2>Generation for {generation.filename}:</h2>
            {generation.questions.map((q) => 
                <QuestionView key={q.id} question={q} generation_id={generation.id} />
            )}
            <br />
            <Formik
                enableReinitialize
                initialValues={customQuestionSchema.cast({})}
                validationSchema={customQuestionSchema}
                onSubmit={create}
            >
                <Form>
                    <label>Question:</label>
                    <Field name="question" type="text" />
                    
                    <label>Correct answer:</label>
                    <Field name="correct_answer" type="text" />
                    
                    <button type="submit">Create</button>
                </Form>
            </Formik>
            <br />
        </div>
    )
}

export default GenerationView;
