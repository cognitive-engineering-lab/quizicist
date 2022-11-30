from pathlib import Path
from flask import Blueprint, Response, jsonify, request
from lib.files import create_file_from_json
from lib.mdbook import questions_to_toml
from lib.parsers.md import md_parser
from models import Generation, Question
from db import db

# routes for JSON API-based Flask app
api = Blueprint("api", __name__, template_folder="templates")


# handle file upload
@api.route("/upload", methods=["POST"])
def upload():
    # save uploaded file
    filename, unique_filename = create_file_from_json()

    # create generation instance in database
    generation = Generation(filename=filename, unique_filename=unique_filename)
    db.session.add(generation)
    db.session.commit()

    # run completion, add generated questions to database
    parser = md_parser
    generation.add_questions(parser)

    return {
        "message": f"Completed generation for {filename}"
    }


# return all generations as JSON
@api.route("/generated/all")
def all_generations():
    # TODO: select id from the query level
    generations = Generation.query.all()

    return jsonify([g.id for g in generations])


# return single generation as JSON
@api.route("/generated/<generation_id>")
def get_generation(generation_id):
    generation = db.get_or_404(Generation, generation_id)

    return jsonify(generation)


# update an item's data
@api.route("/question/<question_id>/update", methods=["POST"])
def update_question(question_id):
    data = request.get_json()

    if not data:
        return "Missing JSON in request", 400

    question: Question = db.get_or_404(Question, question_id)
    question.update(**data)

    return {
        "message": "Updated question"
    }


# generate new item from custom question and answer
@api.route("/generated/<generation_id>/new", methods=["POST"])
def new_item(generation_id):
    generation = db.get_or_404(Generation, generation_id)

    # TODO: avoid having to instantiate with empty options
    question = Question(
        generation_id=generation.id,
        question=request.json["question"],
        correct_answer=request.json["correct_answer"],
        shard=0, # TODO: this should not default to the first shard
        score=0,
    )
    db.session.add(question)
    db.session.commit()

    question.fill_distractors()

    # add distractors to custom question
    question.reroll()
    db.session.commit()

    return {
        "message": "Created custom item"
    }


# delete a generated item
@api.route("/question/<question_id>/delete", methods=["POST"])
def delete(question_id):
    question = db.get_or_404(Question, question_id)

    db.session.delete(question)
    db.session.commit()

    return {
        "message": "Deleted question"
    }


# reroll an item's distractors
@api.route("/question/<question_id>/reroll", methods=["POST"])
def reroll(question_id):
    question: Question = db.get_or_404(Question, question_id)
    question.reroll()

    return {
        "message": "Rerolled question's distractors"
    }


# download mdbook-quiz TOML file
@api.route("/generated/<generation_id>/toml")
def download_toml(generation_id):
    generation = db.get_or_404(Generation, generation_id)
    toml = questions_to_toml(generation.questions)
    filename = Path(generation.filename).stem

    return Response(
        toml,
        mimetype="text/plain",
        headers={ "Content-disposition": f"attachment; filename={filename}-{generation_id}.toml" }
    )
