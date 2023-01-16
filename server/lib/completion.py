from math import ceil
from multiprocessing import Pool
import openai
import os
from dotenv import load_dotenv
from .prompt import Prompt
from .consts import APPEND_PROMPT, GPT_MODEL, MAX_CONTEXT_SIZE, ESTIMATED_QUESTION_SIZE, NUM_QUESTIONS
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


def run_gpt3(shard, num_questions):
    prompt = Prompt(num_questions=num_questions)\
        .add_text(shard, newlines=0)\
        .add_introduction()\
        .add_template()\
        .add_instructions()

    # process question until 5 well-formatted questions have been generated
    # TODO: add tally for failed generations and quit after n
    while True:
        print(f"Running completion on shard...")
        completion = "Question:" + openai.Completion.create(
            engine=GPT_MODEL,
            prompt=prompt.prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.8,
        )["choices"][0]["text"]

        processed = postprocess_edit_mode(completion, num_questions)

        if processed:
            return processed


def complete(file_content, parser, num_questions):
    components = parser(file_content)
    shards = shard_chapter(components)

    # divide questions evenly into shards
    remainder = num_questions % len(shards)
    questions_per_shard = num_questions // len(shards)

    jobs = []
    for index, shard in enumerate(shards):
        if index < remainder:
            jobs.append((shard, questions_per_shard + 1))
        else:
            jobs.append((shard, questions_per_shard))

    # parallelize GPT-3 calls
    with Pool(len(jobs)) as pool:
        return pool.starmap(run_gpt3, jobs)


def add_answer_choices(file_content, parser, question):
    components = parser(file_content)
    shard = shard_chapter(components)[question.shard]

    # partial prompt starting at "Correct answer:"
    question_prompt = Prompt().add_question(question.question)

    # full prompt, appending partial prompt
    prompt = Prompt(num_questions=1)\
        .add_text(shard, newlines=0)\
        .add_introduction()\
        .add_template()\
        .add_instructions()\
        .join(question_prompt)

    # TODO: clean up this loop or consolidate parsing into a single function
    while True:
        print("Running completion for custom question...")
        completion = question_prompt.prompt + openai.Completion.create(
            engine=GPT_MODEL,
            prompt=prompt.prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.8,
        )["choices"][0]["text"]

        processed = postprocess_manual(completion, question.shard)
        if processed:
            return processed

        print(f"Failed to parse the following:\n{completion}")
