# Methodology
This project's intent is to generate multiple choice questions based on content from chapters in the Rust Book. Researchers have developed [a modified book](https://rust-book.cs.brown.edu/) with quizzes embedded in each chapter.

We use the text and questions from [specific chapters](#chapters-used) as context for GPT-3. Each experimental group (a different [prompt type](#types-of-prompts)) generates three sets of 10 questions. Generated questions are judged on [metrics](#metrics-used) used by past researchers.

# Chapters used
## Data types
Located [here](https://rust-book.cs.brown.edu/ch03-02-data-types.html). Describes Rust's data types (scalar types, compound types). Contains text, Rust code samples, and CLI snippets.

## Method syntax
Located [here](https://rust-book.cs.brown.edu/ch05-03-method-syntax.html). Describes the syntax for implementing methods on structs. Contains text and Rust code samples.

## Lifetimes
Located [here](https://rust-book.cs.brown.edu/ch10-03-lifetime-syntax.html). Describes the significance of lifetimes, introduces the borrow checker, and describes the syntax for lifetime generics. Contains text, Rust code samples, and CLI snippets.

# Types of prompts
Each prompt is formed by joining an instruction ("generate 10 multiple-choice questions about the following passage", for example) with context about the topic.

## Text only
The text-only prompt uses the rust book chapter as context for the topic. This is the simplest method for question generation and doesn't provide context for how questions should be formed, the number of possible answers for each question, etc.

## Text with MCQs
This prompt combines the text and MCQs from each rust book chapter as context in the prompt. Each MCQ answer is annotated with whether it's correct or not. 

## Fine-tuned model
OpenAI provides an API to [tune gpt-3 for specific tasks](https://beta.openai.com/docs/guides/fine-tuning). Unlike other methods, using the fine-tuned model doesn't require providing instructions, since the training data establishes a pattern between content provided and MCQs returned. We use generated MCQs that meet a quality threshold as training data for the tuned model.

# Metrics used
Metrics for evaluating question quality are inspired by [Dijkstra et al.](https://intextbooks.science.uu.nl/workshop2022/files/itb22_p1_full5439.pdf).

Each is rated on a scale from 0-100.

## Questions
### Fluency
Whether the question is grammatically correct.

### Relevancy
Whether the question relates to the chapter context.

### Answerability
Whether the answer to the question can be found within the provided context.

## Answer
### Fluency
Whether the answer is grammatically correct.

### Correctness
Whether the answer contains correct information.

### Validity
Whether the answer is the correct answer to the question.

## Distractors
### Fluency
Whether the distractors are grammatically correct.

### Coherence
Whether the distractors are relevant to the context and question.

### Distracting ability
Whether the distractors can mislead the test-taker.

# Research questions/notes
## Completion size/count
As described in OpenAI's [documentation](https://beta.openai.com/docs/api-reference/completions/create#completions/create-max_tokens), the token length of the prompt + completion cannot exceed the model's maximum context length (either 2048 or 4096, depending on which model).

Some chapters contain content which already is well above the token limit for even the largest models. There are a couple options for working around this:
    - Split the content into n sections, generate 10/n questions per chunk of content (total of 10 questions)
    - Remove certain content types (code, headings, console output)
    - Use recursive task decomposition as explained in this [OpenAI blog post](https://openai.com/blog/summarizing-books/)

## Answer context
Feed context into fine-tuned model?

## Further prompt engineering
Instead of providing an example question, provide a template for questions?
