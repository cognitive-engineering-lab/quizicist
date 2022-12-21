import { FeedbackTypes } from "./feedback.type";

type AnswerChoice = {
    id: number;
    question_id: number;

    position: number;
    text: string;
    
    predicted_feedback: FeedbackTypes;
    user_feedback: FeedbackTypes;
};

export default AnswerChoice;
