from math import ceil
import openai
import os
from dotenv import load_dotenv
from .prompt import Prompt
from .consts import APPEND_PROMPT, MAX_CONTEXT_SIZE, ESTIMATED_QUESTION_SIZE, NUM_QUESTIONS
from .postprocess import postprocess_edit_mode, postprocess_manual

# set up openai
load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")

# total number of tokens within a chapter
def chapter_tokens(components):
    return sum(map(lambda c: c["tokens"], components))


def shard_chapter(components):
    total_tokens = chapter_tokens(components)
    max_tokens = total_tokens / ceil(total_tokens / MAX_CONTEXT_SIZE)

    shards = []
    num_tokens = 0
    curr_prompt = ""

    for component in components:
        component_tokens = component["tokens"]
        component_text = component["text"]

        if num_tokens < max_tokens and num_tokens + component_tokens < MAX_CONTEXT_SIZE:
            curr_prompt += component_text
            num_tokens += component_tokens
        else:
            shards.append(curr_prompt)

            curr_prompt = component_text
            num_tokens = component_tokens

    shards.append(curr_prompt)
    return shards



def run_gpt3(shard):
    prompt = "\n".join([shard, APPEND_PROMPT])

    # process question until 5 well-formatted questions have been generated
    # TODO: add tally for failed generations and quit after n
    while True:
        print(f"Running running completion on shard...")
        completion = "\nQuestion: " + openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.9,
        )["choices"][0]["text"]

        processed = postprocess_edit_mode(completion)

        if processed:
            return processed


def complete(file_content, parser):
    components = parser(file_content)
    shards = shard_chapter(components)

    return list(map(run_gpt3, shards))


def reroll_distractors(file_content, parser, question):
    components = parser(file_content)
    shard = shard_chapter(components)[question.shard]

    # partial prompt starting at "Question:"
    question_prompt = Prompt()\
        .add_question(question.question)\
        .add_correct(question.correct_answer)

    # add all locked distractors
    for distractor in filter(lambda d: d.locked, question.distractors):
        question_prompt.add_distractor(distractor.text)

    question_prompt.add_distractor("")

    # full prompt, appending partial prompt
    prompt = Prompt(num_questions=1)\
        .add_text(shard, newlines=0)\
        .add_introduction()\
        .add_template()\
        .add_instructions()\
        .join(question_prompt)

    # TODO: clean up this loop or consolidate parsing into a single function
    while True:
        print("Running reroll completion...")
        completion = question_prompt.prompt + openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt.prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.9,
        )["choices"][0]["text"]

        processed = postprocess_manual(completion, question.shard)
        if processed:
            return processed

        print(f"Failed to parse the following:\n{completion}")
