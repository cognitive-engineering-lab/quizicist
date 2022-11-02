import os
from flask import Flask, render_template, request, redirect, url_for
from lib.completion import complete
from lib.parsers.md import md_parser
from werkzeug.utils import secure_filename
from models import Generation, Question
from db import db

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = os.path.join(APP_FOLDER, "uploads")
PARSERS = {
    "rust": md_parser,
    "mdn": md_parser,
}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///questions.db"

# initialize sqlite db
db.init_app(app)

@app.route("/", methods=["GET"])
def home():
    return render_template("upload.html")

@app.route("/", methods=["POST"])
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
    filename = secure_filename(file.filename)
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(upload_path)

    parser = PARSERS[request.form["book"]]
    with open(upload_path) as upload:
        questions = complete(upload, parser)

    # add generated questions to db
    generation = Generation(filename=filename)
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
            score=0,
        )
        db.session.add(q)

    # commit to db and remove uploaded file
    db.session.commit()
    os.remove(upload_path)

    return redirect(url_for("score", generation_id=generation.id))

@app.route("/generated/<generation_id>")
def score(generation_id):
    generation = db.get_or_404(Generation, generation_id)

    return render_template("score.html", uploaded_file=generation.filename, questions=generation.questions)
