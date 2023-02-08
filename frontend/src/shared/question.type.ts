import AnswerChoice from "./answerchoice.type";

type Question = {
    id: number;
    deleted: boolean;

    question: string;
    original_question: string;
    position: number;
    answers: AnswerChoice[];
    
    shard: number;
    is_custom_question: boolean;
};

export default Question;
