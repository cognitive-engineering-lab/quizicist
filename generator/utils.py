import glob
from math import ceil
import os
import json
import openai
import os
import re
from dotenv import load_dotenv
import sys
from transformers import GPT2Tokenizer
import mistletoe
from mistletoe.ast_renderer import ASTRenderer
from bs4 import BeautifulSoup

from consts import TOP_LEVEL_COMPONENTS, MAX_CONTEXT_SIZE, ESTIMATED_QUESTION_SIZE

load_dotenv()
openai.api_key = os.getenv("OPENAI_SECRET_KEY")
BOOK_DIR = os.path.join(os.getenv("RUST_BOOK_PATH"), "src")

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
DATA_DIR = os.path.join(PROMPTS_DIR, "data")

PROMPT_FILE = os.path.join(DATA_DIR, "prompts.json")
GENERATED_DIR = os.path.join(PROMPTS_DIR, "generated")


def get_prompts():
    with open(PROMPT_FILE) as f:
        return json.load(f)


# clean tags from html within markdown, returning only text
def clean_html(text):
    return BeautifulSoup(text, "lxml").text


# load file content from included listings
def resolve_include(match):
    text = match.group()

    # handle mdn references
    if not text.startswith("{{#"):
        # mdn links to existing docs with the following format: {{domxref("<>")}}
        # where domxref can also be jsxref, glossary, and others
        # we just want to extract the final parameter of these, which is rendered
        params = re.findall(r'"(.*?)"', text)
        
        if len(params) > 0:
            return params[-1]
        
        return ""

    # get filename after "{{#<include type>" and remove trailing "}}"
    filename = text.split(" ")

    if "include" not in filename[0]:
        return ""

    # remove anchor on path
    split_filename = filename[1].split(":")
    if len(split_filename) > 1:
        listing_path = split_filename[0]
    else:
        listing_path = filename[1][:-2]

    listing_path = os.path.join(BOOK_DIR, listing_path)

    with open(listing_path) as f:
        return f.read()


# recurse over MD AST, extracting raw text from inline elements
def find_component_text(component):
    text = []

    for child in component["children"]:
        if child["type"] == "RawText":
            # add content to component text, replacing includes with relevant content
            text.append(re.sub(r'{{(.*?)}}', resolve_include, child["content"]))

        elif child["type"] == "LineBreak":
            text.append(" ")

        elif "children" in child:
            text.append(find_component_text(child))

    if component["type"] in TOP_LEVEL_COMPONENTS:
        text.append("\n")

    return clean_html("".join(text))


# whether a top-level markdown child is valid for parsing
def component_is_valid(component):
    return component["type"] in TOP_LEVEL_COMPONENTS


def extract_component_info(component):
    text = find_component_text(component)
    tokens = tokenizer(text)["input_ids"]

    return {
        "text": text,
        "tokens": len(tokens),
    }


def parse_chapter(chapter):
    chapter_file = os.path.join(DATA_DIR, chapter)

    if not os.path.exists(chapter_file):
        raise ValueError(f"Chapter MD file {chapter} does not exist")

    with open(chapter_file) as cf:
        md = cf.read()

    # extract text and token count from parsed markdown
    parsed = json.loads(mistletoe.markdown(md, ASTRenderer))
    valid_children = filter(component_is_valid, parsed["children"])
    children_info = list(map(extract_component_info, valid_children))

    return children_info

# total number of tokens within a chapter
def chapter_tokens(components):
    return sum(map(lambda c: c["tokens"], components))


def shard_chapter(chapter_components):
    total_tokens = chapter_tokens(chapter_components)
    max_tokens = total_tokens / ceil(total_tokens / MAX_CONTEXT_SIZE)

    shards = []
    num_tokens = 0
    curr_prompt = ""

    for component in chapter_components:
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


# create directory for question generation iteration
def create_output_dir():
    generation_dirs = os.listdir(GENERATED_DIR)
    last_generation = max(map(int, generation_dirs))
    next_generation = str(last_generation + 1).zfill(3)

    pass_dir = os.path.join(GENERATED_DIR, next_generation)
    prompt_dir = os.path.join(pass_dir, "prompts")
    question_dir = os.path.join(pass_dir, "questions")

    os.makedirs(prompt_dir, exist_ok=True)
    os.makedirs(question_dir, exist_ok=True)

    return prompt_dir, question_dir


# get all chapter MD files
def get_chapters():
    return [os.path.basename(f) for f in glob.glob(f"{DATA_DIR}/*.md")]


def generate_prompts(files=[]):
    prompt_dir, question_dir = create_output_dir()
    prompts = get_prompts()
    chapters = get_chapters()

    for prompt_type, prompt_data in prompts.items():
        for chapter in chapters:
            chapter_components = parse_chapter(chapter)
            chapter_shards = shard_chapter(chapter_components)

            for index, shard in enumerate(chapter_shards):
                file_name = f"{chapter[:-3]}-{prompt_type}-{index}.txt"
                print(
                    f"\nRunning completion for prompt {index} of {file_name}")

                prompt_list = [prompt_data["before-text"],
                               shard, prompt_data["after-text"]]

                prompt = "\n".join(prompt_list)

                with open(os.path.join(prompt_dir, file_name), "w+") as f:
                    f.write(prompt)

                try:
                    completion = openai.Completion.create(
                        engine="text-davinci-002",
                        prompt=prompt,
                        max_tokens=5 * ESTIMATED_QUESTION_SIZE
                    )
                except openai.error.InvalidRequestError:
                    print(
                        f"ERROR: too many tokens in prompt for {chapter}, consider splitting it into more prompts")
                    return

                print(
                    f"Finished completion for prompt {index} of {file_name}, writing output to file")
                with open(os.path.join(question_dir, file_name), "w+") as f:
                    f.write(completion["choices"][0]["text"])


if __name__ == "__main__":
    args = sys.argv[1:]
    generate_prompts(files=args)
