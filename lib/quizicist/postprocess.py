import json
import openai
import os
from dotenv import load_dotenv
from .consts import ESTIMATED_QUESTION_SIZE, GPT_MODEL, NUM_QUESTIONS, FeedbackTypes
from .prompt import Prompt, PromptType

# set up openai
load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")


EDIT_MODE_INSTRUCTION = {
    PromptType.MCQ: """
Convert the generated questions to a JSON array parseable by Python. Each object should use the following schema:

{
    "question": "",
    "correct": "", 
    "incorrect": ["", "", ""]
}

Use the text of each answer choice. Do not include answer choice letters. Include code snippets in the "question" field.
""",
    PromptType.OPEN_ENDED: """
Convert the list of questions into an array of JSON objects parseable by Python. 
Do not assign the JSON to a variable. 
Each object should contain keys for "question" and "follow-up".
""",
}

def postprocess_with_gpt(prompt: Prompt, num_questions=NUM_QUESTIONS):
    # add instruction to convert to JSON
    prompt.add_message(
        role="user",
        content=EDIT_MODE_INSTRUCTION[prompt.prompt_type]
    )

    completion = openai.ChatCompletion.create(
        model=GPT_MODEL,
        messages=prompt.messages, 
        max_tokens=num_questions * ESTIMATED_QUESTION_SIZE,
        temperature=0.8,
    )

    edited = completion["choices"][0]["message"]["content"]

    with open("testing.txt", "a+") as f:
        f.write(edited)

    # decode generated JSON
    try:
        parsed = json.loads(edited)
    except json.JSONDecodeError:
        return False

    # ensure gpt-3 generated correct number of questions questions
    if type(parsed) is not list or len(parsed) != num_questions:
        return False

    return parsed


def postprocess_manual(answers: str, shard: int):
    # grab question, if no correct answer return False
    question, _, remaining = answers.partition("\nCorrect answer: ")
    if question == "":
        return False

    # grab correct answer, if no incorrect answers return False
    correct, _, remaining = remaining.partition("\nIncorrect answer: ")
    if correct == "":
        return False
    
    # add correct answer to list of choices
    options = [{
        "text": correct,
        "predicted_feedback": FeedbackTypes.correct,
    }]

    # recurse over remaining choices until no incorrect answers left
    while remaining != "":
        answer, _, remaining = remaining.partition("\nIncorrect answer: ")

        # when no choices left, add remaining text as an option
        if answer == "":
            options.append({
                "text": remaining,
                "predicted_feedback": FeedbackTypes.incorrect,
            })

            break
        
        options.append({
            "text": answer,
            "predicted_feedback": FeedbackTypes.incorrect,
        })

    if len(options) < 4:
        return False

    return {
        "question": question,
        "options": options,
        "shard": shard,
    }
