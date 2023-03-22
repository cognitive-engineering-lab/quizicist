import enum


# gpt model to use for generating questions
GPT_MODEL = "gpt-4"

# gpt model to use for converting questions to JSON
JSON_MODEL = "gpt-3.5-turbo"

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
ESTIMATED_QUESTION_SIZE = 175

# assuming generating 5 questions per shard, largest context possible
MAX_CONTEXT_SIZE = MAX_MODEL_PROMPT_SIZE - NUM_QUESTIONS * ESTIMATED_QUESTION_SIZE

# feedback options for answer choices
class FeedbackTypes(enum.IntEnum):
    unselected = 0
    correct = 1
    incorrect = 2