## What you'll need
 - An [OpenAI account](https://beta.openai.com/signup) (preferably on the paid plan)
 - A local copy of the [Rust Book](https://github.com/rust-lang/book)

## Setting up your environment
You'll need to create a `.env` file in the root of the project with the following key-value pairs:
```
OPENAI_SECRET_KEY=<your openai API key>
RUST_BOOK_PATH=/path/to/copy/of/rust-book
```

## Running the app
```shell
$ pip install -r requirements.txt
$ python app/create_db.py # set up local sqlite database
$ flask --app app/main --debug run # run server in debug mode
```

## Using the app
 1. Navigate to http://localhost:5000
 2. In the file selector, choose a markdown file from either the [Rust Book's source](https://github.com/rust-lang/book/tree/main/src) or [MDN Learn's source](https://github.com/mdn/content/tree/main/files/en-us/learn/javascript)
 3. Once submitted, the request will take ~30 seconds and redirect to a page displaying each generated question
