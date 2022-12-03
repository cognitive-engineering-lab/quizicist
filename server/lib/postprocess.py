import json
import openai
import os
from dotenv import load_dotenv
from .consts import NUM_QUESTIONS

# set up openai
load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")


EDIT_MODE_INSTRUCTION = 'Convert the list of questions into an array of JSON objects parseable by Python. Do not assign the JSON to a variable. Each object should contain keys for "question", "correct", and "incorrect".'

def postprocess_edit_mode(output: str):
    edited = openai.Edit.create(
        model="code-davinci-edit-001",
        input=output,
        instruction=EDIT_MODE_INSTRUCTION,
        n=1,
        temperature=0,
    )["choices"][0]["text"]
    
    # decode generated JSON
    try:
        parsed = json.loads(edited)
    except json.JSONDecodeError:
        return False

    # ensure gpt-3 generated 5 questions
    if type(parsed) is not list or len(parsed) != NUM_QUESTIONS:
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

    # recurse over remaining choices until no incorrect answers left
    options = []
    while remaining != "":
        answer, _, remaining = remaining.partition("\nIncorrect answer: ")

        # when no choices left, add remaining text as an option
        if answer == "":
            options.append(remaining)
            break
        
        options.append(answer)

    if len(options) < 3:
        return False

    return {
        "question": question,
        "correct": correct,
        "options": options,
        "shard": shard,
    }