import os
from flask import Flask, render_template, request
from lib.completion import complete
from lib.parsers.md import md_parser
from werkzeug.utils import secure_filename
import json

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = os.path.join(APP_FOLDER, "uploads")
PARSERS = {
    "rust": md_parser,
    "mdn": md_parser,
}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/", methods=["GET"])
def upload():
    return render_template("upload.html")

@app.route("/", methods=["POST"])
def score():
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

    os.remove(upload_path)

    return render_template("score.html", uploaded_file=filename, questions=questions)
