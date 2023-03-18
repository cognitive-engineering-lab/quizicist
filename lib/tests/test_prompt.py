from quizicist.prompt import Prompt, PromptType

def test_prompt():
    for prompt_type in [PromptType.MCQ, PromptType.OPEN_ENDED]:
        prompt = Prompt(prompt_type=prompt_type)
        prompt.add_system_prompt()
        prompt.add_message(role="user", content="hello world")
        assert len(prompt.messages) == 2