from __future__ import annotations
from .consts import NUM_QUESTIONS
from typing import TypedDict, List
from enum import Enum

class PromptType(Enum):
    MCQ = 1
    OPEN_ENDED = 2

PROMPTS = {
   PromptType.MCQ: """
You are a professor creating a challenging multiple-choice quiz for your class.
The questions you write will test your students' knowledge of concepts from the passage above.
The questions will be very difficult, cover distinct topics, and not restate simple facts from the passage.
The quiz contains {num_questions} multiple-choice questions.

Use the following template for each question:

Question:
Correct answer:
Incorrect answer 1:
Incorrect answer 2:
Incorrect answer 3:
""",
    PromptType.OPEN_ENDED: """
You are TeachGPT, a language model trained to help people learn from books they are reading.
You will be given an excerpt from a book. You will give as output a set of open-ended questions
about the excerpt. Each question should encourage readers to think deeply about the meaning of the excerpt.
You will generate {num_questions} questions. Use the following template for each question:

Question:
Follow-up question:
"""
}

class Message(TypedDict):
    role: str
    content: str

class Prompt:
    messages: List[Message]
    num_questions: int
    prompt_type: PromptType

    def __init__(self, prompt_type=PromptType.MCQ, num_questions=NUM_QUESTIONS):
        self.messages = []
        self.prompt_type = prompt_type
        self.num_questions = num_questions

    def add_message(self, role: str, content: str) -> Prompt:
        self.messages.append({
            "role": role,
            "content": content
        })        
        return self

    def add_system_prompt(self) -> Prompt:
        intro = PROMPTS[self.prompt_type].format(num_questions=self.num_questions)
        return self.add_message(role="system", content=intro)