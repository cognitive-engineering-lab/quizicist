# Quizicist: an AI-powered quiz generator

## Getting started
Want to quickly generate a quiz? Visit our hosted Quizicist instance at [quizici.st](https://quizici.st). With a piece of text content (eg. a textbook or lecture notes), Quizicist can generate a quiz in minutes. Once you review the questions and mark answers as correct or incorrect, you can export the quiz to Google Forms, [mdbook-quiz](https://github.com/cognitive-engineering-lab/mdbook-quiz), or plain text.

## Running Quizicist locally
Running into rate limits at [quizici.st](https://quizici.st)? Quizicist can be deployed locally with the following instructions:

### Environment variables
You'll need to create a `.env` file in the root of the project with the following key-value pair:
```
OPENAI_SECRET_KEY=<your openai API key>
```

### Dependencies
You'll also need to install dependencies:
```shell
$ cd lib && pip3 install -e . && cd ..
$ cd site && pip3 install -r requirements.txt
$ cd frontend && npm install
```

### Database
When developing/running locally, we use SQLite to store generated items:
```shell
$ cd site
$ python3 create_db.py # set up local sqlite database
```

### Running the server + frontend
In one shell:
```shell
$ cd site
$ flask --app backend/main --debug run --port 5000 # run server in debug mode
```

In another shell:
```shell
$ cd site/frontend && npm run dev -- --port 3000
```
