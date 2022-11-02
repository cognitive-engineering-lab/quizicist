def postprocess_question(answers: str):
    # grab question, if no correct answer return False
    question, _, remaining = answers.partition("\nCorrect answer: ")
    if question == "":
        return False

    # grab correct answer, if no incorrect answers return False
    correct, _, remaining = remaining.partition("\nIncorrect answer: ")
    if correct == "":
        return False

    # recurse over remaining choices until no incorrect answers left
    options = []
    while remaining != "":
        answer, _, remaining = remaining.partition("\nIncorrect answer: ")

        # when no choices left, add remaining text as an option
        if answer == "":
            options.append(remaining)
            break
        
        options.append(answer)

    if len(options) < 3:
        return False

    return {
        "question": question,
        "correct": correct,
        "options": options,
    }
