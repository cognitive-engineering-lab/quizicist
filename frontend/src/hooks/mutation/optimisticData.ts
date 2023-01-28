import { FeedbackTypes } from "@shared/feedback.type";
import Generation from "@shared/generation.type";
import _ from "lodash";

export const deleteQuestionOptimistic = (current: Generation, questionId: number) => {
    // remove current question from quiz data
    const question = _.find(current.questions, (q) => q.id === questionId)!;
    question.deleted = true;

    return current;
}

export const deleteAnswerOptimistic = (current: Generation, questionId: number, answerId: number) => {
    const q = _.find(current.questions, { id: questionId })!;

    // remove answer choice from quiz data
    const answer = _.find(q.answers, (a) => a.id === answerId)!;
    answer.deleted = true;

    return current;
}

export const giveFeedbackOptimistic = (current: Generation, questionId: number, answerId: number, feedback: FeedbackTypes) => {
    const q = _.find(current.questions, { id: questionId })!;
    const a = _.find(q.answers, { id: answerId })!;

    // update answer choice feedback
    a.user_feedback = feedback;

    return current;
}
