from backend.main import app
from backend.db import db

# if running as a script, create db
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
