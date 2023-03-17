import json
import os
import re
import sys

QUESTION_HEADER = "question-section:"
answer_choice_pattern = r"\(([A-E]\*?)\)(.*)"

# get textbook directory passed as arg
chapter_directory = sys.argv[1]
subdirs = [ f.path for f in os.scandir(chapter_directory) if f.is_dir() ]

items = []

def serialize_completion(question, correct, incorrect):
    completion = f"Question: {question}"
    completion += f"\nCorrect: {correct}"

    for answer in incorrect:
        completion += f"\nIncorrect: {answer}"
    
    completion += "END"

    return completion


QUESTION_GOALS = {
    "1": "the properties or summary of a program",
    "2": "the output of a program",
    "3": "a hypothetical program or design choice",
    "4": "writing or replacing code",
    "5": "general programming knowledge",
}

QUESTION_FORMATS = {
    "1": ":",
    "2": " with multiple options:"
}

# loop through folders (chapters) in directory
for subdir in subdirs:
    # open questions.txt file in folder
    with open(os.path.join(subdir, "questions.txt")) as f:
        content = f.read()

    # parse questions
    questions = content.split(QUESTION_HEADER)[1:]

    for question in questions:
        question_dict = {}

        lines = question.split("\n")
        number = int(lines[0])
        question_type = lines[1].strip().split(" ")

        question_goal = QUESTION_GOALS[question_type[0]]
        question_format = QUESTION_FORMATS[question_type[1]]

        directions = "\n\n" + "The following question asks about " + question_goal + question_format
        
        key = "question"
        for line in lines[2:]:
            # check if new line starts an answer choice
            match = re.match(answer_choice_pattern, line)
            if match:
                key = match.group(1)
                line = match.group(2).strip()

            # store line content in question dictionary
            if key not in question_dict:
                question_dict[key] = line
            else:
                question_dict[key] += "\n" + line

        intermediate = {
            "number": number,
            "question": question_dict["question"],
            "incorrect_answers": [],
        }

        # convert from A, B, etc to correct_answer and incorrect_answers
        for k, v in question_dict.items():
            # skip question, answer, possible duplicate answers
            if k in intermediate:
                continue

            if "*" in k:
                intermediate["correct_answer"] = v
            else:
                intermediate["incorrect_answers"].append(v)

        section_paths = [filename for filename in os.listdir(subdir) if filename.startswith(f"{number}-")]
        if not section_paths:
            raise ValueError(f"No section file found for {subdir}/{number}")

        with open(os.path.join(subdir, section_paths[0]), "r") as f:
            section_content = f.read()

        prompt = section_content + directions + "\n\n###\n\n"

        if "correct_answer" not in intermediate:
            print(intermediate["question"])

        completion = serialize_completion(intermediate["question"], intermediate["correct_answer"], intermediate["incorrect_answers"])

        items.append({
            "prompt": prompt,
            "completion": completion,
        })

with open(f"{chapter_directory}.jsonl", "w+") as f:
    for item in items:
        json.dump(item, f)
        f.write("\n")
