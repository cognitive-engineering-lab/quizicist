import AnswerChoice from "./answerchoice.type";

type Question = {
    id: number;
    deleted: boolean;

    question: string;
    position: number;
    answers: AnswerChoice[];
    
    shard: number;
};

export default Question;
