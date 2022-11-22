import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from blueprints.api import api
from blueprints.legacy import legacy
from db import db

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = os.path.join(APP_FOLDER, "uploads")

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///questions.db"

# initialize sqlite db
db.init_app(app)

# enable CORS
CORS(app)

# add blueprints for JSON API and legacy routes
app.register_blueprint(api, url_prefix="/api")
app.register_blueprint(legacy, url_prefix="/legacy")

@app.before_first_request
def setup():
    # create directory for file uploads
    Path(os.path.join(APP_FOLDER, "uploads")).mkdir(exist_ok=True)
