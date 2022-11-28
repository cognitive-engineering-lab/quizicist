from pathlib import Path
from flask import Blueprint, Response, current_app, request, redirect, render_template, url_for
import os
from blueprints.shared import PARSERS
from lib.completion import reroll_distractors
from lib.files import handle_file_upload
from lib.mdbook import questions_to_toml
from models import Generation, Question
from db import db

# routes for vanilla Flask app (not JSON API)
legacy = Blueprint("legacy", __name__, template_folder="templates")


# render upload form
@legacy.route("/", methods=["GET"])
def home():
    return render_template("upload.html")


# handle file upload
@legacy.route("/", methods=["POST"])
def upload():
    # save uploaded file
    filename, unique_filename = handle_file_upload()

    # create generation instance in database
    generation = Generation(filename=filename, unique_filename=unique_filename)
    db.session.add(generation)
    db.session.commit()

    # run completion, add generated questions to database
    parser = PARSERS[request.form["book"]]
    generation.add_questions(parser)

    return redirect(url_for("legacy.score", generation_id=generation.id))


# render generated items
@legacy.route("/generated/<generation_id>")
def score(generation_id):
    generation = db.get_or_404(Generation, generation_id)

    return render_template(
        "score.html",
        uploaded_file=generation.filename,
        questions=generation.questions,
        generation_id=generation_id
    )


# reroll an item's distractors
@legacy.route("/generated/<generation_id>/reroll/<question_id>", methods=["POST"])
def reroll(generation_id, question_id):
    generation = db.get_or_404(Generation, generation_id)
    question = db.get_or_404(Question, question_id)

    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], generation.unique_filename)
    with open(upload_path) as upload:
        # TODO: support dynamic parser like upload path
        # or store components instead of file
        rerolled = reroll_distractors(upload, PARSERS["rust"], question)

    question.option1 = rerolled["options"][0]
    question.option2 = rerolled["options"][1]
    question.option3 = rerolled["options"][2]
    db.session.commit()

    return redirect(url_for("legacy.score", generation_id=generation.id))


# generate new item from question and answer
@legacy.route("/generated/<generation_id>/new", methods=["POST"])
def new_item(generation_id):
    generation = db.get_or_404(Generation, generation_id)

    # TODO: avoid having to instantiate with empty options
    question = Question(
        generation_id=generation.id,
        question=request.form["question"],
        correct_answer=request.form["answer"],
        option1="",
        option2="",
        option3="",
        shard=0, # TODO: this should not default to the first shard
        score=0,
    )
    db.session.add(question)

    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], generation.unique_filename)
    with open(upload_path) as upload:
        # TODO: don't only reroll with first shard
        rerolled = reroll_distractors(upload, PARSERS["rust"], question)

    question.option1 = rerolled["options"][0]
    question.option2 = rerolled["options"][1]
    question.option3 = rerolled["options"][2]
    db.session.commit()

    return redirect(url_for("legacy.score", generation_id=generation.id))


# delete a generated item
@legacy.route("/generated/<generation_id>/delete/<question_id>", methods=["POST"])
def delete(generation_id, question_id):
    generation = db.get_or_404(Generation, generation_id)
    question = db.get_or_404(Question, question_id)

    db.session.delete(question)
    db.session.commit()

    return redirect(url_for("legacy.score", generation_id=generation.id))


# download mdbook-quiz TOML file
@legacy.route("/generated/<generation_id>/toml")
def download_toml(generation_id):
    generation = db.get_or_404(Generation, generation_id)
    toml = questions_to_toml(generation.questions)
    filename = Path(generation.filename).stem

    return Response(
        toml,
        mimetype="text/plain",
        headers={ "Content-disposition": f"attachment; filename={filename}-{generation_id}.toml" }
    )
