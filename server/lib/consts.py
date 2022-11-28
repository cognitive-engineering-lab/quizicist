# markdown element types valid at the top level
TOP_LEVEL_COMPONENTS = [
    "Paragraph",
    "CodeFence",
    "List"
]

# number of questions to generate per shard
NUM_QUESTIONS = 5

# maximum tokens allowed in DaVinci-2 model prompt
MAX_MODEL_PROMPT_SIZE = 4000

# estimated number of tokens generated from a single MCQ
ESTIMATED_QUESTION_SIZE = 90

# assuming generating 5 questions per shard, largest context possible
MAX_CONTEXT_SIZE = MAX_MODEL_PROMPT_SIZE - NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE

QUESTION_TEMPLATE = """
Question:
Correct answer:
Incorrect answer:
Incorrect answer:
Incorrect answer:
"""

# text to append to chapter content
APPEND_PROMPT = f"""
Generate {NUM_QUESTIONS} multiple-choice questions to test a reader's comprehension of the programming concepts above.

Use the following format for each question:
{QUESTION_TEMPLATE}

{NUM_QUESTIONS} multiple-choice questions:

Question:"""
