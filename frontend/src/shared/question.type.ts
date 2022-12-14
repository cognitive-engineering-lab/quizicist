import AnswerChoice from "./answerchoice.type";

type Question = {
    id: number;

    question: string;
    position: number;
    answers: AnswerChoice[];
    
    shard: number;
};

export default Question;
