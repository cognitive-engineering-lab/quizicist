from pathlib import Path
from flask import Blueprint, Response, current_app, request, redirect, render_template, url_for
from werkzeug.utils import secure_filename
import uuid
import os
from blueprints.shared import PARSERS
from lib.completion import complete, reroll_distractors
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
    if "file" not in request.files:
        return "No file selected"

    if "book" not in request.form:
        return "No resource type selected"

    file = request.files['file']

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        return "No file selected"

    # save file to disk
    filename = file.filename
    unique_filename = secure_filename(f"{uuid.uuid4().hex}-{filename}")

    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(upload_path)

    parser = PARSERS[request.form["book"]]
    with open(upload_path) as upload:
        questions = complete(upload, parser)

    # add generated questions to db
    generation = Generation(filename=filename, unique_filename=unique_filename)
    db.session.add(generation)
    db.session.commit()

    for question in questions:
        q = Question(
            generation_id=generation.id,
            question=question["question"],
            correct_answer=question["correct"],
            option1=question["options"][0],
            option2=question["options"][1],
            option3=question["options"][2],
            shard=question["shard"],
            score=0,
        )
        db.session.add(q)

    # add questions to db
    db.session.commit()

    return redirect(url_for("score", generation_id=generation.id))


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

    return redirect(url_for("score", generation_id=generation.id))


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
