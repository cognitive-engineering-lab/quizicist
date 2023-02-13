from flask import Blueprint
from flask_login import LoginManager, login_user, current_user
from ..models import User
from ..db import db

login_manager = LoginManager()

# routes for authentication in JSON API
auth = Blueprint("auth", __name__, template_folder="templates")


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@auth.route("/authenticated", methods=["GET"])
def authenticated():
    return { "authenticated": current_user.is_authenticated }


# create user
@auth.route("/authenticate", methods=["POST"])
def authenticate():
    if current_user.is_authenticated:
        return {
            "message": "Already authenticated"
        }

    user = User()

    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)

    return {
        "message": f"Successfully authenticated with ID: {user.id}"
    }
