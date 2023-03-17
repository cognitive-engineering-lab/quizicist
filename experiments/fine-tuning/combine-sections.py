"""

Each chapter is split into sections based on subject. This script combines sections until
a maximum number of GPT tokens has been reached.

"""

from glob import glob
from pathlib import Path
import sys
from typing import Dict
from transformers import GPT2Tokenizer


# maximum number of tokens per combined section
MAX_TOKENS = 1650 # 1500 for barron's

# GPT tokenizer
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# parse sections from chapter content
def get_sections(chapter: str) -> Dict[str, str]:
    chapter = "\n" + chapter
    sections = chapter.split("\n=====")[1:]

    result = {}
    for section in sections:
        title, content = section.split("=====\n")
        result[title] = content
    
    return result


# create text files for each group of combined sections
def combine_sections(chapter: str, chapter_content: str):
    sections = get_sections(chapter_content)
    
    # create directory for combined section files
    chapter_dir = Path(chapter)
    chapter_dir.mkdir(parents=True, exist_ok=True)
    
    # list of combined sections
    paired_sections = [[]]
    current_tokens = 0

    # find sections that can combine
    for title, content in sections.items():
        tokens = len(tokenizer(content)["input_ids"])
        
        if tokens > MAX_TOKENS:
            raise ValueError(f"Section '{title}' has too many tokens ({tokens} > {MAX_TOKENS})")
        
        if current_tokens + tokens > MAX_TOKENS:
            paired_sections.append([title])
            current_tokens = tokens
        else:
            paired_sections[-1].append(title)
            current_tokens += tokens

    # combine section content into text file
    for index, pair in enumerate(paired_sections):
        title = "+".join(pair)
        file = f"{index}-{title}.txt"

        content = ""
        for section in pair:
            content += sections[section]

        with open(chapter_dir / file, "w+") as f:
            f.write(content)


def main():
    # get all files with chapter content
    chapter_directory = sys.argv[1]
    chapter_glob = f"{chapter_directory}/*.chapter.txt"
    chapter_files = glob(chapter_glob)

    # extract sections from chapter content into text files
    for file in chapter_files:
        with open(file, "r") as f:
            content = f.read()

        chapter = file.split(".")[0]
        combine_sections(chapter, content)


if __name__ == "__main__":
    main()
