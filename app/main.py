import os
from pathlib import Path
from flask import Flask
from blueprints.legacy import legacy
from db import db

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = os.path.join(APP_FOLDER, "uploads")

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///questions.db"

# initialize sqlite db
db.init_app(app)

# add blueprints for legacy and JSON API routes
app.register_blueprint(legacy, url_prefix="/legacy")

@app.before_first_request
def setup():
    # create directory for file uploads
    Path(os.path.join(APP_FOLDER, "uploads")).mkdir(exist_ok=True)
