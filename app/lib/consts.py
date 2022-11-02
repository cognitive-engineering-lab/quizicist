# markdown element types valid at the top level
TOP_LEVEL_COMPONENTS = [
    "Paragraph",
    "CodeFence",
    "List"
]

# maximum tokens allowed in DaVinci-2 model prompt
MAX_MODEL_PROMPT_SIZE = 4000

# estimated number of tokens generated from a single MCQ
ESTIMATED_QUESTION_SIZE = 90

# assuming generating 5 questions per shard, largest context possible
MAX_CONTEXT_SIZE = MAX_MODEL_PROMPT_SIZE - 5 * ESTIMATED_QUESTION_SIZE

# text prepended to chapter content
PREPEND_PROMPT = """Based on the text between the =====, generate 5 multiple-choice questions to test a reader's comprehension of the text's concepts

=====
"""

# text to append to chapter content
APPEND_PROMPT = """=====

Use the following example format for each question:
Question:
Correct answer:
Incorrect answer:
Incorrect answer:
Incorrect answer:

5 multiple-choice questions:

Question:"""
