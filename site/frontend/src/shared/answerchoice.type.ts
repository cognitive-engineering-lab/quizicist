import { FeedbackTypes } from "./feedback.type";

type AnswerChoice = {
    id: number;
    question_id: number;
    deleted: boolean;

    position: number;
    text: string;
    original_text: string;
    
    predicted_feedback: FeedbackTypes;
    user_feedback: FeedbackTypes;
};

export default AnswerChoice;
