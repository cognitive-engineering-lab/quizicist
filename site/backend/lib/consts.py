import enum

# message options for user-provided messages
class MessageTypes(enum.IntEnum):
    error = 0
    suggestion = 1
    other = 2

# methods for exporting forms
class ExportTypes(enum.IntEnum):
    google_forms = 0
    mdbook = 1
    plain_text = 2

# LLMs used to generate questions
class ModelTypes(str, enum.Enum):
    gpt3 = 0
    gpt4 = 1
