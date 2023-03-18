import json
import openai
import os
from dotenv import load_dotenv
from .consts import NUM_QUESTIONS, FeedbackTypes
from .prompt import PromptType

# set up openai
load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")


EDIT_MODE_INSTRUCTION = {
    PromptType.MCQ: """
Convert the list of questions into an array of JSON objects parseable by Python. 
Do not assign the JSON to a variable. 
Each object should contain keys for "question", "correct", and "incorrect".'
""",
    PromptType.OPEN_ENDED: """
Convert the list of questions into an array of JSON objects parseable by Python. 
Do not assign the JSON to a variable. 
Each object should contain keys for "question" and "follow-up".
""",
}

def postprocess_edit_mode(output: str, prompt_type: PromptType, num_questions=NUM_QUESTIONS):
    edited = openai.Edit.create(
        model="code-davinci-edit-001",
        input=output,
        instruction=EDIT_MODE_INSTRUCTION[prompt_type],
        n=1,
        temperature=0,
    )["choices"][0]["text"]

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
