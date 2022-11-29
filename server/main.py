import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from blueprints.api import api
from blueprints.legacy import legacy
from dotenv import load_dotenv
from db import db
from config import APP_FOLDER

app = Flask(__name__)

# set config based on ENV variable
load_dotenv()
CONFIG_CLASS = "ProductionConfig" if os.getenv("ENV") == "prod" else "DebugConfig"
app.config.from_object(f"config.{CONFIG_CLASS}")

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
