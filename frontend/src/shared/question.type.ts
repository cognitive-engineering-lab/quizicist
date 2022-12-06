import Distractor from "./distractor.type";
import Feedback from "./feedback.type";

type Question = {
    id: number;

    question: string;
    correct_answer: string;
    distractors: Distractor[];
    
    shard: number;
    feedback?: Feedback;
};

export default Question;
