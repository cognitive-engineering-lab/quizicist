import enum


# gpt model to use
GPT_MODEL = "gpt-4"

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

# feedback options for answer choices
class FeedbackTypes(enum.IntEnum):
    unselected = 0
    correct = 1
    incorrect = 2