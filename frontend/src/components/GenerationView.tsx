import useSWR from "swr";
import { fetcher } from "../hooks/shared";
import { SERVER_URL } from "../shared/consts";
import Generation from "../shared/generation.type"
import QuestionView from "./QuestionView";

type GenerationProps = {
    generation_id: number;
};

const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const { data: generation } = useSWR<Generation>(`${SERVER_URL}/generated/${generation_id}`, fetcher);

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
        </div>
    )
}

export default GenerationView;
