import itertools
from math import ceil
import os
import openai
import os
from dotenv import load_dotenv
from .consts import APPEND_PROMPT, PREPEND_PROMPT, MAX_CONTEXT_SIZE, ESTIMATED_QUESTION_SIZE, NUM_QUESTIONS, QUESTION_TEMPLATE
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



def run_gpt3(shard_num: int, shard):
    prompt = "\n".join([PREPEND_PROMPT, shard, APPEND_PROMPT])
    questions = []

    # process question until 5 well-formatted questions have been generated
    while len(questions) < NUM_QUESTIONS:
        print(f"{len(questions)} questions -- running completion")
        completion = "\nQuestion: " + openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.9,
        )["choices"][0]["text"]

        for question in completion.split("\nQuestion: ")[1:]:
            if len(questions) == NUM_QUESTIONS:
                break

            processed = postprocess_question(question, shard_num)
            if processed:
                questions.append(processed)

        print(f"Generated {len(questions)} questions")
    
    return questions


def complete(file_content, parser):
    components = parser(file_content)
    shards = shard_chapter(components)
    return list(itertools.chain(*map(lambda t: run_gpt3(*t), enumerate(shards))))


def reroll_distractors(file_content, parser, question):
    components = parser(file_content)
    shard = shard_chapter(components)[question.shard]

    # TODO: these strings are really difficult to read
    partial_question = f"""Question: {question.question}
Correct answer: {question.correct_answer}
Incorrect answer:"""

    prompt = f"""{shard}
    Complete the multiple-choice question based on the passage above.
    
    The question uses the following format:
    {QUESTION_TEMPLATE}
    Add three incorrect answers.
    {partial_question}"""

    # TODO: clean up this loop or consolidate parsing into a single function
    while True:
        print("Running reroll completion...")
        completion = partial_question + openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt,
            max_tokens=NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE,
            temperature=0.7,
        )["choices"][0]["text"]

        processed = postprocess_question(completion, question.shard)
        if processed:
            return processed

        print(f"Failed to parse the following:\n{completion}")
