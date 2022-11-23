import Distractor from "./distractor.type";

type Question = {
    id: number;

    question: string;
    correct_answer: string;
    distractors: Distractor[];
    
    shard: number;
    score: number;
};

export default Question;
