import os
import json
import sys
import openai
import os
from dotenv import load_dotenv
import numpy

load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
DATA_DIR = os.path.join(PROMPTS_DIR, "data")

CHAPTER_DIR = os.path.join(DATA_DIR, "chapters")
PROMPT_FILE = os.path.join(DATA_DIR, "prompts.json")
GENERATED_DIR = os.path.join(PROMPTS_DIR, "generated")

# split `key` chapter into `value` prompts
SPLIT_PROMPTS = {
    "ch03-02-data-types.json": 2,
    "ch05-03-method-syntax.json": 2,
    "ch10-03-lifetime-syntax.json": 5,
}


def get_prompts():
    with open(PROMPT_FILE) as f:
        return json.load(f)


def get_chapter_files():
    return os.listdir(CHAPTER_DIR)


def get_chapter_elements(chapter_file):
    with open(os.path.join(CHAPTER_DIR, chapter_file)) as f:
        return json.load(f)


def combine_els(prompt_type, prompt_data, elements, quiz_content):
    # join elements in each chunk to form prompt
    content = "\n\n".join([el["content"] for el in elements])

    prompt_list = [prompt_data["before-text"],
                   content, prompt_data["after-text"]]

    if prompt_type == "text-with-mcqs":
        prompt_list.extend([prompt_data["before-quiz"],
                           quiz_content, prompt_data["after-quiz"]])

    return "\n".join(prompt_list)


def generate_prompts_split(prompt_type, prompt_data, chapter_file, split=1, filter_els=["quiz", "heading"]):
    # get chapter content and split into chunks
    chapter_elements = get_chapter_elements(chapter_file)

    # remove filtered elements, filter quizzes into separate list
    chapter_elements = list(filter(
        lambda el: el["type"] not in filter_els, chapter_elements))
    chapter_quizzes = filter(lambda el: el["type"] == "quiz", chapter_elements)

    # split remaining elements into chunks
    chapter_elements = numpy.array_split(numpy.array(chapter_elements), split)

    # TODO: add quiz content
    quiz_content = ""

    return list(map(lambda chunk: combine_els(prompt_type, prompt_data, chunk, quiz_content), chapter_elements))


def generate_prompts(files=[]):
    # create directory for question generation pass
    pass_dir = os.path.join(GENERATED_DIR, "002")
    prompt_dir = os.path.join(pass_dir, "prompts")
    question_dir = os.path.join(pass_dir, "questions")
    os.makedirs(prompt_dir, exist_ok=True)
    os.makedirs(question_dir, exist_ok=True)

    prompts = get_prompts()
    chapters = files if len(files) > 0 else get_chapter_files()

    for prompt_type, prompt_data in prompts.items():
        for chapter in chapters:
            prompts = generate_prompts_split(
                prompt_type, prompt_data, chapter, split=SPLIT_PROMPTS[chapter])

            for index, prompt in enumerate(prompts):
                file_name = f"{chapter[:-5]}-{prompt_type}-{index}"
                print(f"Running completion for prompt {index} of {file_name}")

                with open(os.path.join(prompt_dir, file_name), "w+") as f:
                    f.write(prompt)

                try:
                    completion = openai.Completion.create(
                        engine="text-davinci-002", prompt=prompt, max_tokens=2000)
                except openai.error.InvalidRequestError:
                    print(
                        f"ERROR: too many tokens in prompt for {chapter}, consider splitting it into more prompts")
                    return

                print(f"Finished completion for prompt {index} of {file_name}, writing output to file")
                with open(os.path.join(question_dir, file_name), "w+") as f:
                    f.write(completion["choices"][0]["text"])


if __name__ == "__main__":
    args = sys.argv[1:]
    generate_prompts(files=args)
