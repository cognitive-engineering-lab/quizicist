from flask import Blueprint, jsonify, request
from flask_login import current_user
from quizicist.errors import QuizicistError
from ..lib.consts import ExportTypes, ModelTypes
from ..lib.export import GoogleFormExport
from ..lib.files import create_file_from_json
from ..lib.mdbook import questions_to_toml
from ..models import AnswerChoice, Export, Generation, Question, Message
from ..db import db
from ..limiter import limiter
import openai.error as OpenAIError

# routes for JSON API-based Flask app
api = Blueprint("api", __name__, template_folder="templates")

# require authentication for API routes
@api.before_request
def require_authentication():
    # don't block CORS preflight requests
    if request.method == "OPTIONS":
        return

    if not current_user.is_authenticated:
        return { "message": "Authentication required" }, 401


# create quiz from markdown/text content
@api.route("/upload", methods=["POST"])
@limiter.limit("10/hour")
def upload():
    if "count" not in request.json:
        return "Missing number of questions in request", 400

    num_questions = int(request.json["count"])

    if num_questions > 15 or num_questions < 1:
        return "Invalid number of questions", 400

    content_type = request.json["content_type"]
    if content_type not in ["Markdown", "Plain Text"]:
        return "Invalid content type", 400

    # save uploaded file
    filename, unique_filename = create_file_from_json()

    # create generation instance in database
    generation = Generation(
        user_id=current_user.id,
        filename=filename,
        unique_filename=unique_filename,
        content_type=content_type,
        model=ModelTypes.gpt4
    )
    db.session.add(generation)

    # conditionally retrieve custom prompt from request
    custom_prompt = None if not request.json["is_custom_prompt"] else request.json["custom_prompt"]

    # run completion, add generated questions to database
    generation.add_questions(num_questions, custom_prompt)

    db.session.commit()

    return {
        "message": f"Completed generation for {filename}"
    }


# return all generations as JSON
@api.route("/generated/all")
def all_generations():
    # TODO: select id from the query level
    generations = Generation.query \
        .filter_by(user_id=current_user.id) \
        .order_by(Generation.id.desc()).all()

    return jsonify([g.id for g in generations])


# return single generation as JSON
@api.route("/generated/<generation_id>")
def get_generation(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    return jsonify(generation)


# update a quiz's data
@api.route("/generated/<generation_id>/update", methods=["POST"])
def update_generation(generation_id):
    data = request.get_json()

    if not data:
        return "Missing JSON in request", 400

    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)
    generation.update(**data)

    return {
        "message": "Updated generation"
    }


# create more questions for existing generation
@api.route("/generated/<generation_id>/more", methods=["POST"])
@limiter.limit("10/hour")
def generate_more(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    if "count" not in request.json:
        return "Missing number of questions in request", 400

    num_questions = int(request.json["count"])

    if num_questions > 10 or num_questions < 1:
        return "Invalid number of questions", 400

    # run completion, add generated questions to database
    generation.add_questions(num_questions)

    return {
        "message": f"Added questions for {generation.filename}"
    }


# delete a generation
@api.route("/generated/<generation_id>/delete", methods=["POST"])
def delete_generation(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    generation.deleted = True
    db.session.commit()

    return {
        "message": "Deleted generation"
    }


# update an item's data
@api.route("/question/<question_id>/update", methods=["POST"])
def update_question(question_id):
    data = request.get_json()

    if not data:
        return "Missing JSON in request", 400

    question: Question = db.get_or_404(Question, question_id)
    question.check_ownership(current_user.id)
    question.update(**data)

    return {
        "message": "Updated question"
    }


# add more answer choices for question
@api.route("/question/<question_id>/more", methods=["POST"])
def add_answer_choices(question_id):
    data = request.get_json()

    if not data:
        return "Missing JSON in request", 400

    question: Question = db.get_or_404(Question, question_id)
    question.check_ownership(current_user.id)
    
    # query GPT-3 for more answer choices
    # TODO: customize number of answer choices to add
    question.generation.add_answer_choices(question)

    return {
        "message": "Added answer choices"
    }


# generate new item from custom question and answer
@api.route("/generated/<generation_id>/new", methods=["POST"])
@limiter.limit("30/hour")
def new_item(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    question = Question(
        question=request.json["question"],
        original_question=request.json["question"],
        is_custom_question=True,
        shard=0, # TODO: this should probably not default to the first shard
    )
    generation.questions.append(question)
    db.session.commit()

    # add answer choices
    generation.add_answer_choices(question)

    return {
        "message": "Created custom item"
    }


# delete a generated item
@api.route("/question/<question_id>/delete", methods=["POST"])
def delete(question_id):
    question: Question = db.get_or_404(Question, question_id)
    question.check_ownership(current_user.id)

    question.deleted = True
    db.session.commit()

    return {
        "message": "Deleted question"
    }


@api.route("/question/<question_id>/feedback", methods=["POST"])
def question_feedback(question_id):
    # TODO: update this route to use answer ID in URL
    data = request.get_json()

    if not data:
        return "Missing JSON in request", 400

    answer: AnswerChoice = db.get_or_404(AnswerChoice, data["answer"])
    answer.check_ownership(current_user.id)
    answer.update(user_feedback=int(data["value"]))

    return {
        "message": "Added feedback"
    }


@api.route("/question/<question_id>/<answer_id>/delete", methods=["POST"])
def answer_delete(question_id, answer_id):
    answer: AnswerChoice = db.get_or_404(AnswerChoice, answer_id)
    answer.check_ownership(current_user.id)

    answer.deleted = True
    db.session.commit()

    return {
        "message": "Deleted answer choice"
    }


# create and share a Google Form for a generation
@api.route("/generated/<generation_id>/google_form", methods=["POST"])
@limiter.limit("10/hour")
def create_google_form(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    email = request.json["email"]

    if not email:
        return "Missing email in request", 400

    # create Google Form
    export = GoogleFormExport()
    form_id = export.create_form(generation)

    # share form with provided email
    export.share_form(form_id, email)

    # log export with forms ID
    export_entry = Export(
        generation_id=generation.id,
        export_type=ExportTypes.google_forms,
        google_form_id=form_id
    )
    db.session.add(export_entry)
    db.session.commit()

    return {
        "message": f"Shared form {form_id} with {email}"
    }


@api.route("/generated/<generation_id>/log_export", methods=["POST"])
def log_export(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    export_type = request.json["export_type"]

    if not export_type:
        return "Missing export type in request", 400
    
    export_entry = Export(
        generation_id=generation.id,
        export_type=int(export_type),
    )
    db.session.add(export_entry)
    db.session.commit()

    return {
        "message": "Logged quiz export"
    }


@api.route("/message/upload", methods=["POST"])
@limiter.limit("30/hour")
def upload_message():
    if "message_type" not in request.json:
        return "Message type is required", 400

    if "message" not in request.json:
        return "Message is required", 400

    message_type = int(request.json["message_type"])
    message = Message(
        user_id=current_user.id,
        message_type=message_type,
        message=request.json["message"]
    )
    
    db.session.add(message)
    db.session.commit()

    return "Uploaded message"


# download mdbook-quiz TOML file
@api.route("/generated/<generation_id>/toml")
def download_toml(generation_id):
    generation: Generation = db.get_or_404(Generation, generation_id)
    generation.check_ownership(current_user.id)

    return questions_to_toml(generation.questions)

@api.errorhandler(QuizicistError)
def handle_quizicist_error(e):
    return { "message": str(e) }, 500

@api.errorhandler(OpenAIError.ServiceUnavailableError)
def handle_service_unavailable(_):
    return {
        "message": "OpenAI is experiencing server issues. Please wait a few minutes and try again."
    }, 500

@api.errorhandler(OpenAIError.RateLimitError)
def handle_rate_limit(_):
    return {
        "message": "We're currently experiencing high demand. Please wait a few minutes and try again."
    }, 500

@api.errorhandler(OpenAIError.Timeout)
def handle_timeout(_):
    return {
        "message": "OpenAI took too long to respond. Please try again. If the error is not resolved, please submit feedback detailing your error."
    }, 500
