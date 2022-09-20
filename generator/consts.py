# chapters to generate questions for
CHAPTERS = [
    "ch03-02-data-types.md",
    "ch05-03-method-syntax.md",
    "ch10-03-lifetime-syntax.md",
]

# markdown element types valid at the top level
TOP_LEVEL_COMPONENTS = [
    "Paragraph",
    "CodeFence",
    "List"
]

# maximum tokens allowed in DaVinci-2 model prompt
MAX_MODEL_PROMPT_SIZE = 4001

# estimated number of tokens generated from a single MCQ
ESTIMATED_QUESTION_SIZE = 90

# assuming generating 5 questions per shard, largest context possible
MAX_CONTEXT_SIZE = MAX_MODEL_PROMPT_SIZE - 5 * ESTIMATED_QUESTION_SIZE
