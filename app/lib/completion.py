import itertools
from math import ceil
import os
import openai
import os
from dotenv import load_dotenv
from .consts import APPEND_PROMPT, PREPEND_PROMPT, MAX_CONTEXT_SIZE, ESTIMATED_QUESTION_SIZE
from .postprocess import postprocess_question

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
    prompt = "\n".join([PREPEND_PROMPT, shard, APPEND_PROMPT])
    questions = []

    # process question until 5 well-formatted questions have been generated
    while len(questions) < 5:
        print(f"{len(questions)} questions -- running completion")
        completion = "\nQuestion: " + openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt,
            max_tokens=5 * ESTIMATED_QUESTION_SIZE
        )["choices"][0]["text"]

        for question in completion.split("\nQuestion: ")[1:]:
            if len(questions) == 5:
                break

            processed = postprocess_question(question)
            if processed:
                questions.append(processed)

        print(f"Generated {len(questions)} questions")
    
    return questions


def complete(file_content, parser):
    components = parser(file_content)
    shards = shard_chapter(components)
    return list(itertools.chain(*map(run_gpt3, shards)))
