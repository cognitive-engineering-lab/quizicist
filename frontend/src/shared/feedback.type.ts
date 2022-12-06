export enum FeedbackTypes {
    neutral = 0,
    positive = 1,
    negative = 2,
}

type Feedback = {
    id: number;
    question_id: number;

    value: FeedbackTypes;
    text: string;
};

export default Feedback;
