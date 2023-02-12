import Question from "./question.type";

type Generation = {
    id: number;
    filename: string;
    unique_filename: string;
    questions: Question[];
};

export default Generation;
