from typing import Tuple
from flask import request, current_app
import os
import uuid
from werkzeug.utils import secure_filename

def handle_file_upload() -> Tuple[str, str, str]:
    """
    Saves an uploaded file to disk with a unique filename.
    
    Returns a tuple with the original filename, unique filename, and path to file on disk.
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

    return (filename, unique_filename, upload_path)
