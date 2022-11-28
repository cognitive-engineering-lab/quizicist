import random
import toml

def serialize_question(question):
    choices = [
        question.correct_answer,
        question.option1,
        question.option2,
        question.option3,
    ]

    random.shuffle(choices)
    correct = choices.index(question.correct_answer)

    return {
        "type": "MultipleChoice",
        "prompt": {
            "prompt": question.question,
            "choices": choices,
        },
        "answer": { "answer": correct },
    }


def questions_to_toml(questions):
    return toml.dumps({ "questions": list(map(serialize_question, questions)) })
