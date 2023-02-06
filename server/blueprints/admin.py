from datetime import datetime, timedelta
from db import db
from flask import Blueprint, request
from flask_bcrypt import Bcrypt
from flask_login import current_user
from models import User
import os
from limiter import limiter

# routes for admin dashboard
admin = Blueprint("admin", __name__, template_folder="templates")

# password hashing utilities
bcrypt = Bcrypt()

# ensure admin access hasn't expired
@admin.before_request
def require_admin():
    # don't block CORS preflight requests
    if request.method == "OPTIONS":
        return

    # ensure authenticated
    if not current_user.is_authenticated:
        return { "message": "Authentication required" }, 401
    
    # exempt /authenticate route from admin requirement
    if request.path == "/admin/authenticate":
        return

    user = User.query.get(current_user.id)
    if not user.admin_expires or user.admin_expires < datetime.now():
        return { "message": "Admin access has expired" }, 403


@admin.route("/authenticate", methods=["POST"])
@limiter.limit("10/minute")
def authenticate():
    password = request.json["password"]
    hashed = os.getenv("ADMIN_PASSWORD")

    if not bcrypt.check_password_hash(hashed, password):
        return { "message": "Incorrect admin password" }, 401
    
    user: User = User.query.get(current_user.id)
    user.admin_expires = datetime.now() + timedelta(days=10)
    db.session.commit()

    return { "message": "Successfully authenticated" }
