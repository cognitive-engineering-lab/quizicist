type Question = {
    id: number;

    question: string;
    correct_answer: string;
    option1: string;
    option2: string;
    option3: string;
    
    shard: number;
    score: number;
};

export default Question;
