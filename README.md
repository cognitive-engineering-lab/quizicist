# Getting started
## Dependencies
All dependencies required to generate questions can be installed from `requirements.txt`

## Environment
You'll need to create a `.env` file in the root of the project with the following key-value pairs:
```
OPENAI_SECRET_KEY=<your openai key>
RUST_BOOK_PATH=/path/to/copy/of/rust-book
```
The Rust Book path is used to resolve links to code listings.

## Passages
Currently, only MD files from the Rust Book and MDN Learn resources are supported. Place each file you want to generate questions for in `/generator/prompts/data/`.

## Generating quetions
Once you've completed these steps, you should be ready to generate questions! Run the following command from the root of the project: `python generator/utils.py`. 

(TODO: update file naming and structure)