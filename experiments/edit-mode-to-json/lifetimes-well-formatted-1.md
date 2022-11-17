# Variables
```
temperature: 0.7
top_p = 1.0
```

# Input
```
Question: Which of the following is not a reason to use generic lifetime parameters?
Correct answer: So references are valid as long as we need them to be
Incorrect answer: To prevent dangling references
Incorrect answer: To express the relationship between the lifetimes of the parameters and the return value
Incorrect answer: To ensure that a type has the behavior we want

Question: Which of the following will not compile?
Correct answer: fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
Incorrect answer: fn longest(x: &str, y: &str) -> &str {
Incorrect answer: fn longest<'a>(x: &'a str, y: &str) -> &str
Incorrect answer: fn longest<'a>(x: &str, y: &'a str) -> &'a str

Question: What is the main aim of lifetimes?
Correct answer: To prevent dangling references
Incorrect answer: To ensure that a type has the behavior we want
Incorrect answer: To express the relationship between the lifetimes of the parameters and the return value
Incorrect answer: So references are valid as long as we need them to be

Question: In Listing 10-18, why is x valid for the outer scope?
Correct answer: Because its scope is larger
Incorrect answer: Because its lifetime is longer
Incorrect answer: Because it is a reference
Incorrect answer: Because we annotated it with a generic lifetime parameter

Question: What does Rust use to compare scopes to determine whether all borrows are valid?
Correct answer: The Rust compiler has a borrow checker
Incorrect answer: We annotate the relationships using generic lifetime parameters
Incorrect answer: Lifetime annotations
Incorrect answer: Most of the time, lifetimes are implicit and inferred
```

# Instructions
Convert the list of questions into an array of JSON objects. Each object should contain keys for "question", "correct", and "incorrect".

# Output
## Output 1
```json
[
  {
    "question": "Which of the following is not a reason to use generic lifetime parameters?",
    "correct": "So references are valid as long as we need them to be",
    "incorrect": [
      "To prevent dangling references",
      "To express the relationship between the lifetimes of the parameters and the return value",
      "To ensure that a type has the behavior we want"
    ]
  },
  {
    "question": "Which of the following will not compile?",
    "correct": "fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {",
    "incorrect": [
      "fn longest(x: &str, y: &str) -> &str {",
      "fn longest<'a>(x: &'a str, y: &str) -> &str",
      "fn longest<'a>(x: &str, y: &'a str) -> &'a str"
    ]
  },
  {
    "question": "What is the main aim of lifetimes?",
    "correct": "To prevent dangling references",
    "incorrect": [
      "To ensure that a type has the behavior we want",
      "To express the relationship between the lifetimes of the parameters and the return value",
      "So references are valid as long as we need them to be"
    ]
  },
  {
    "question": "In Listing 10-18, why is x valid for the outer scope?",
    "correct": "Because its scope is larger",
    "incorrect": [
      "Because its lifetime is longer",
      "Because it is a reference",
      "Because we annotated it with a generic lifetime parameter"
    ]
  },
  {
    "question": "What does Rust use to compare scopes to determine whether all borrows are valid?",
    "correct": "The Rust compiler has a borrow checker",
    "incorrect": [
      "We annotate the relationships using generic lifetime parameters",
      "Lifetime annotations",
      "Most of the time, lifetimes are implicit and inferred"
    ]
  }
]
```

## Output 2
```json
[
{
  question: "Which of the following is not a reason to use generic lifetime parameters?",
  correct: "So references are valid as long as we need them to be",
  incorrect: ["To prevent dangling references", "To express the relationship between the lifetimes of the parameters and the return value", "To ensure that a type has the behavior we want"]
},
{
  question: "Which of the following will not compile?",
  correct: "fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {",
  incorrect: ["fn longest(x: &str, y: &str) -> &str {", "fn longest<'a>(x: &'a str, y: &str) -> &str", "fn longest<'a>(x: &str, y: &'a str) -> &'a str"]
},
{
  question: "What is the main aim of lifetimes?",
  correct: "To prevent dangling references",
  incorrect: ["To ensure that a type has the behavior we want", "To express the relationship between the lifetimes of the parameters and the return value", "So references are valid as long as we need them to be"]
},
{
  question: "In Listing 10-18, why is x valid for the outer scope?",
  correct: "Because its scope is larger",
  incorrect: ["Because its lifetime is longer", "Because it is a reference", "Because we annotated it with a generic lifetime parameter"]
},
{
  question: "What does Rust use to compare scopes to determine whether all borrows are valid?",
  correct: "The Rust compiler has a borrow checker",
  incorrect: ["We annotate the relationships using generic lifetime parameters", "Lifetime annotations", "Most of the time, lifetimes are implicit and inferred"]
}
]
```

## Output 3
```json
[
    {
        question: 'Which of the following is not a reason to use generic lifetime parameters?',
        correct: 'So references are valid as long as we need them to be',
        incorrect: [
            'To prevent dangling references',
            'To express the relationship between the lifetimes of the parameters and the return value',
            'To ensure that a type has the behavior we want'
        ]
    },
    {
        question: 'Which of the following will not compile?',
        correct: 'fn longest<\'a>(x: &\'a str, y: &\'a str) -> &\'a str {',
        incorrect: [
            'fn longest(x: &str, y: &str) -> &str {',
            'fn longest<\'a>(x: &\'a str, y: &str) -> &str',
            'fn longest<\'a>(x: &str, y: &\'a str) -> &\'a str'
        ]
    },
    {
        question: 'What is the main aim of lifetimes?',
        correct: 'To prevent dangling references',
        incorrect: [
            'To ensure that a type has the behavior we want',
            'To express the relationship between the lifetimes of the parameters and the return value',
            'So references are valid as long as we need them to be'
        ]
    },
    {
        question: 'In Listing 10-18, why is x valid for the outer scope?',
        correct: 'Because its scope is larger',
        incorrect: [
            'Because its lifetime is longer',
            'Because it is a reference',
            'Because we annotated it with a generic lifetime parameter'
        ]
    },
    {
        question: 'What does Rust use to compare scopes to determine whether all borrows are valid?',
        correct: 'The Rust compiler has a borrow checker',
        incorrect: [
            'We annotate the relationships using generic lifetime parameters',
            'Lifetime annotations',
            'Most of the time, lifetimes are implicit and inferred'
        ]
    }
]

```