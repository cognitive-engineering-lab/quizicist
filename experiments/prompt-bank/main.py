import functools
import operator
import os
from pathlib import Path

PROMPTS = ["api-comparison", "hypothetical"]
BANK_DIR = os.path.dirname(os.path.realpath(__file__))
TEST_FILES_DIR = os.path.join(BANK_DIR, "test-files")

# add parent dir to path to allow importing from server dir
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.sys.path.insert(0, os.path.join(parent_dir, "server"))
from lib.completion import complete
from lib.parsers.md import md_parser

for test_dir in PROMPTS:
    test_dir = os.path.join(BANK_DIR, test_dir)
    prompt_dir = os.path.join(test_dir, "prompts")

    for prompt_file in os.listdir(prompt_dir):
        prompt_file = os.path.abspath(os.path.join(prompt_dir, prompt_file))

        with open(prompt_file) as pf:
            prompt = pf.read()

        with open(os.path.join(TEST_FILES_DIR, "traits.md")) as cf:
            content = cf.read()
        
        # retrieve and flatten results
        completion = complete(content, md_parser, 5, prompt)
        completion = functools.reduce(operator.iconcat, completion, [])
        
        prompt_no_ext = Path(prompt_file).stem
        results_file = os.path.join(test_dir, "results", f"{prompt_no_ext}-output.txt")
        with open(results_file, "w+") as rf:
            for question in completion:
                # a python string abomination
                formatted = \
                f"""Question: {question['question']}
                Code: {question['code']}
                Correct: {question['correct']}
                Incorrect: {'''
                Incorrect: '''.join(question['incorrect'])}\n\n"""

                rf.write(formatted)
