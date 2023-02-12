from typing import Tuple
from flask import request, current_app
import os
import re
import uuid
from werkzeug.utils import secure_filename

def handle_file_upload() -> Tuple[str, str]:
    """
    Saves an uploaded file to disk with a unique filename.
    
    Returns a tuple with the original filename and unique filename.
    """

    if "file" not in request.files:
        raise ValueError("No file selected")

    file = request.files['file']

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        raise ValueError("No file selected")

    # save file to disk
    filename = file.filename
    unique_filename = secure_filename(f"{uuid.uuid4().hex}-{filename}")

    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(upload_path)

    return (filename, unique_filename)


def create_file_from_json() -> Tuple[str, str]:
    """
    Saves plain-text content uploaded as JSON to disk as markdown.
    """
    
    title = request.json["title"]
    content = request.json["content"]
    is_markdown = request.json["content_type"] == "Markdown"

    if not title:
        raise ValueError("Title is a required field")

    if not content:
        raise ValueError("Content is a required field")
    
    # if user submitted plain text, escape before saving as markdown
    if not is_markdown:
        # TODO: more robust escaping for plain text
        escape_chars = r'_*[]()~`>#+-=|{}.!'
        content = re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', content)

    unique_filename = secure_filename(f"{uuid.uuid4().hex}-{title}.md")
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    with open(upload_path, "w+") as f:
        f.write(content)

    return (title, unique_filename)
