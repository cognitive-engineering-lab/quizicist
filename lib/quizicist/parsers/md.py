from dotenv import load_dotenv
import os
import json
import re
import mistletoe
from mistletoe.ast_renderer import ASTRenderer
from bs4 import BeautifulSoup
from transformers import GPT2Tokenizer
from ..consts import TOP_LEVEL_COMPONENTS

# required to resolve code listings
load_dotenv()
BOOK_DIR = os.path.join(os.getenv("RUST_BOOK_PATH") or "", "src")

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

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

    # handle files not found in Rust Book listings
    try:
        with open(listing_path) as f:
            return f.read()
    except OSError:
        return ""


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


def md_parser(chapter):
    # extract text and token count from parsed markdown
    parsed = json.loads(mistletoe.markdown(chapter, ASTRenderer))
    valid_children = filter(component_is_valid, parsed["children"])
    children_info = map(extract_component_info, valid_children)
    non_empty_components = list(filter(lambda c: c["tokens"] > 0, children_info))

    return non_empty_components
