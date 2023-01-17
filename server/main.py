import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from blueprints.api import api
from blueprints.auth import auth, login_manager
from dotenv import load_dotenv
from db import db, migrate
from config import APP_FOLDER
from limiter import limiter

app = Flask(__name__)

# set config based on ENV variable
load_dotenv()
CONFIG_CLASS = "ProductionConfig" if os.getenv("ENV") == "prod" else "DebugConfig"
app.config.from_object(f"config.{CONFIG_CLASS}")

# initialize sqlite db with migrations
db.init_app(app)
migrate.init_app(app, db)

# limit requests by IP
limiter.init_app(app)

# initialize flask-login authentication
login_manager.init_app(app)

# enable CORS
CORS(app, supports_credentials=True)

# add blueprints for JSON API and authentication
app.register_blueprint(api, url_prefix="/api")
app.register_blueprint(auth, url_prefix="/auth")

@app.before_first_request
def setup():
    # create directory for file uploads
    Path(os.path.join(APP_FOLDER, "uploads")).mkdir(exist_ok=True)
