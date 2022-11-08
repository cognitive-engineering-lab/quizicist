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

# text prepended to chapter content
PREPEND_PROMPT = """"""

# text to append to chapter content
APPEND_PROMPT = f"""
Generate {NUM_QUESTIONS} multiple-choice questions to test a reader's comprehension of the above passage.

Use the following format for each question:
Question:
Correct answer:
Incorrect answer:
Incorrect answer:
Incorrect answer:

{NUM_QUESTIONS} multiple-choice questions:

Question:"""
