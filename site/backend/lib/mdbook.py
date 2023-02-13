from typing import List
import toml
from ..models import Question
from quizicist.consts import FeedbackTypes

def get_answer_by_feedback(question: Question, feedback: FeedbackTypes):
    return [choice.text for choice in question.answers if choice.user_feedback == feedback]

def serialize_question(question: Question):
    incorrect = get_answer_by_feedback(question, FeedbackTypes.incorrect)
    correct = get_answer_by_feedback(question, FeedbackTypes.correct)

    return {
        "type": "MultipleChoice",
        "prompt": {
            "prompt": question.question,
            "distractors": incorrect,
        },
        "answer": { "answer": correct },
    }


def questions_to_toml(questions: List[Question]):
    # remove deleted questions
    questions = filter(lambda question: not question.deleted, questions)

    # remove questions without one correct answer
    questions = filter(lambda question: len(get_answer_by_feedback(question, FeedbackTypes.correct)) == 1, questions)

    return toml.dumps({ "questions": list(map(serialize_question, questions)) })
