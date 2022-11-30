import os

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = os.path.join(APP_FOLDER, "uploads")

MYSQL_USERNAME = os.getenv("MYSQL_USERNAME")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_DB = os.getenv("MYSQL_DB")


# base config for debug and production
class Config(object):
    # folder for markdown file uploads
    UPLOAD_FOLDER = UPLOAD_FOLDER

    # secure secret key loaded from .env
    SECRET_KEY = os.environ.get("FLASK_SECRET", "UNSAFE_DEBUG_SECRET")
    FLASK_SECRET = SECRET_KEY

    # allow Content-Type header cross-origin
    CORS_HEADERS = "Content-Type"


# for use in local development
class DebugConfig(Config):
    DEVELOPMENT = True
    DEBUG = True

    # path to local sqlite database
    SQLALCHEMY_DATABASE_URI = "sqlite:///questions.db"

    # store flask limiter data in memory
    RATELIMIT_STORAGE_URI = "memory://"
    

# for use in production environment (Google VM)
class ProductionConfig(Config):
    DEVELOPMENT = False
    DEBUG = False

    SQLALCHEMY_DATABASE_URI = f"mysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"

    # store flask limiter data in memcached
    RATELIMIT_STORAGE_URI = "memcached://localhost:11211"

    # allow requests only from quizici.st
    CORS_ORIGINS = ["https://quizici.st"]
