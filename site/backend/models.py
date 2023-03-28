from __future__ import annotations
from dataclasses import dataclass
from typing import List
from .db import db
from flask import current_app
from flask_login import UserMixin
from flask_sqlalchemy.query import Query
from Levenshtein import distance
from quizicist.completion import complete, add_answer_choices, chapter_tokens
from quizicist.parsers.md import md_parser
from quizicist.parsers.text import parse_text
from quizicist.consts import FeedbackTypes
from .lib.consts import ExportTypes, MessageTypes, ModelTypes
import os
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy.ext.orderinglist import OrderingList
from werkzeug.exceptions import Unauthorized
import types

# length of VARCHAR field for questions, answers, and filenames
ITEM_LENGTH=1000
FILENAME_LENGTH=400

# content parsers for uploaded text
PARSERS = {
    "Markdown": md_parser,
    "Plain Text": parse_text,
}

# `dataclasses.todict` tries to initialize lists with a generator
# which fails because the `OrderingList` constructor takes a `str`
# we override the `OrderingList` implementation to enable serialization
class CustomList(OrderingList):
    def __init__(self, *args):
        # handle construction from generator
        if isinstance(args[0], types.GeneratorType):
            return list.__init__(self, list(args[0]))

        return OrderingList.__init__(self, *args)


# replaces SQLAlchemy's `ordering_list`
def create_ordering_list(attr: str) -> CustomList:
    return lambda: CustomList(attr)


# implements the soft delete pattern, from Miguel Grinberg:
# https://blog.miguelgrinberg.com/post/implementing-the-soft-delete-pattern-with-flask-and-sqlalchemy
class QueryWithSoftDelete(Query):
    _with_deleted = False

    def __new__(cls, *args, **kwargs):
        obj = super(QueryWithSoftDelete, cls).__new__(cls)
        obj._with_deleted = kwargs.pop('_with_deleted', False)
        if len(args) > 0:
            super(QueryWithSoftDelete, obj).__init__(*args, **kwargs)
            return obj.filter_by(deleted=False) if not obj._with_deleted else obj
        return obj

    def __init__(self, *args, **kwargs):
        pass

    def with_deleted(self):
        return self.__class__(self._only_full_mapper_zero('get'),
                              session=db.session(), _with_deleted=True)

    def _get(self, *args, **kwargs):
        # this calls the original query.get function from the base class
        return super(QueryWithSoftDelete, self).get(*args, **kwargs)

    def get(self, *args, **kwargs):
        # the query.get method does not like it if there is a filter clause
        # pre-loaded, so we need to implement it using a workaround
        obj = self.with_deleted()._get(*args, **kwargs)
        return obj if obj is None or self._with_deleted or not obj.deleted else None

class UpdateMixin:
    @hybrid_method
    def update(self, **kwargs):
        for key, value in kwargs.items():
            # don't modify ID
            if key in ["id"]:
                continue

            # don't modify deleted items
            if self.deleted:
                continue

            if hasattr(self, key):
                setattr(self, key, value)

        db.session.commit()


@dataclass
class Export(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    generation_id: int = db.Column(db.Integer, db.ForeignKey("generation.id"))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    export_type: ExportTypes = db.Column(db.Enum(ExportTypes))
    google_form_id: str = db.Column(db.String(200), nullable=True)


@dataclass
class Generation(db.Model, UpdateMixin):
    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    model: ModelTypes = db.Column(db.Enum(ModelTypes), server_default=ModelTypes.gpt3.name)

    query_class = QueryWithSoftDelete
    deleted: bool = db.Column(db.Boolean(), default=False, nullable=False)

    filename: str = db.Column(db.String(FILENAME_LENGTH))
    unique_filename: str = db.Column(db.String(FILENAME_LENGTH))
    questions: List[Question] = db.relationship(
        "Question",
        order_by="Question.position",
        collection_class=create_ordering_list("position"),
    )

    exports: List[Export] = db.relationship(Export, backref="generation")

    # format of uploaded content
    content_type: str = db.Column(db.String(10), default="Markdown", nullable=False)

    @hybrid_property
    def upload_path(cls):
        return os.path.join(current_app.config["UPLOAD_FOLDER"], cls.unique_filename)

    @hybrid_property
    def undeleted_questions(self):
        return [question for question in self.questions if not question.deleted]

    # check if quiz has been interacted with
    @hybrid_property
    def interacted_with(self):
        # containes edited questions
        edited_questions = [question for question in self.undeleted_questions if question.edited]
        if len(edited_questions) > 0:
            return True

        # has been exported
        if len(self.exports) > 0:
            return True

        return False

    @hybrid_property
    def total_question_edits(self):
        distances = map(lambda question: distance(question.original_question, question.question), self.undeleted_questions)
        return sum(distances)
    
    @hybrid_property
    def total_answer_edits(self):
        answers = [answer for question in self.undeleted_questions for answer in question.undeleted_answers]
        distances = map(lambda answer: distance(answer.original_text, answer.text), answers)
        return sum(distances)

    @hybrid_property
    def time_to_export(self):
        if not self.exports:
            return None

        first_export: Export = self.exports[0]
        return (first_export.created_at - self.created_at).total_seconds() / 60.0

    @hybrid_property
    def content_tokens(self):
        parser = PARSERS[self.content_type]

        with open(self.upload_path) as upload:
            parsed = parser(upload)

        return chapter_tokens(parsed)

    @hybrid_property
    def num_questions(self):
        return len(self.undeleted_questions)

    @hybrid_property
    def percent_answers_scored(self):
        answers = [answer for question in self.undeleted_questions for answer in question.undeleted_answers]
        scored = [answer for answer in answers if answer.user_feedback != FeedbackTypes.unselected]

        return len(scored) * 100 / len(answers)

    # percent of user-provided feedback that matches prediction
    @hybrid_property
    def percent_feedback_matching(self):
        def get_question_feedback(question: Question):
            matching = 0
            not_matching = 0

            for answer in question.undeleted_answers:
                if answer.user_feedback == FeedbackTypes.unselected:
                    continue

                if answer.user_feedback == answer.predicted_feedback:
                    matching += 1
                else:
                    not_matching += 1
            
            return matching, not_matching
        
        feedback = map(get_question_feedback, self.undeleted_questions)
        feedback = tuple(map(sum, zip(*feedback)))
        total = feedback[0] + feedback[1]

        if total == 0:
            return None

        return feedback[0] * 100 / total

    # TODO: remove need for parser
    @hybrid_method
    def add_questions(self, num_questions, custom_prompt=None):
        parser = PARSERS[self.content_type]

        # run gpt-3 completion
        with open(self.upload_path) as upload:
            shards = complete(upload, parser, num_questions, custom_prompt)

        for shard, questions in enumerate(shards):
            for question in questions:
                q = Question(
                    question=question["question"],
                    original_question=question["question"],
                    shard=shard,
                )
                self.questions.append(q)
                db.session.commit()

                # create correct answer choice
                correct = AnswerChoice(
                    text=question["correct"],
                    original_text=question["correct"],
                    predicted_feedback=FeedbackTypes.correct
                )
                q.answers.append(correct)

                # create answer choices for incorrect choices
                for incorrect in question["incorrect"]:
                    distractor = AnswerChoice(
                        text=incorrect,
                        original_text=incorrect,
                        predicted_feedback=FeedbackTypes.incorrect
                    )
                    q.answers.append(distractor)

        # add distractors to db
        db.session.commit()

    @hybrid_method
    def add_answer_choices(self, question: Question):
        with open(self.upload_path) as upload:
            custom_output = add_answer_choices(upload, PARSERS[self.content_type], question)
        
        for option in custom_output["options"]:
            choice = AnswerChoice(
                text=option["text"],
                original_text=option["text"], # TODO: is there a better way to do this?
                predicted_feedback=option["predicted_feedback"]
            )
            question.answers.append(choice)

        db.session.commit()

    @hybrid_method
    def check_ownership(self, user_id):
        if self.user_id != user_id:
            raise Unauthorized("User doesn't have access to this quiz")

@dataclass
class Question(db.Model, UpdateMixin):
    __tablename__ = "question"

    id: int = db.Column(db.Integer, primary_key=True)
    generation_id: int = db.Column(db.Integer, db.ForeignKey("generation.id"))

    query_class = QueryWithSoftDelete
    deleted: bool = db.Column(db.Boolean(), default=False, nullable=False)

    # text of question asked
    question: str = db.Column(db.String(ITEM_LENGTH))

    # original (unedited) text of question
    original_question: str = db.Column(db.String(ITEM_LENGTH))

    # tracks whether question is user-written
    is_custom_question: bool = db.Column(db.Boolean(), default=False, nullable=False)

    # order in list of quiz questions
    position: int = db.Column(db.Integer)

    # all answer choices for question
    # uses `ordering_list` to manage order
    answers: List[AnswerChoice] = db.relationship(
        "AnswerChoice",
        order_by="AnswerChoice.position",
        collection_class=create_ordering_list("position"),
    )

    # shard of uploaded content used to generate question
    shard: int = db.Column(db.Integer, default=0)

    @hybrid_property
    def generation(self):
        return db.session.query(Generation).get(self.generation_id)

    @hybrid_property
    def undeleted_answers(self):
        return [answer for answer in self.answers if not answer.deleted]

    @hybrid_property
    def edited(self):
        # is deleted
        if self.deleted:
            return True

        # is custom question
        if self.is_custom_question:
            return True

        # question edited
        if self.original_question != self.question:
            return True

        # answer edited
        return any(map(lambda answer: answer.edited, self.undeleted_answers))

    @hybrid_method
    def update(self, **kwargs):
        if "answers" in kwargs:
            for current, new in zip(self.answers, kwargs["answers"]):
                current.update(**new)

        kwargs.pop("answers", None)
        super(Question, self).update(**kwargs)

    @hybrid_method
    def check_ownership(self, user_id):
        if self.generation.user_id != user_id:
            raise Unauthorized("User doesn't have access to this question")


@dataclass
class AnswerChoice(db.Model, UpdateMixin):
    __tablename__ = "answerchoice"

    id: int = db.Column(db.Integer, primary_key=True)
    question_id: int = db.Column(db.Integer, db.ForeignKey("question.id"))

    query_class = QueryWithSoftDelete
    deleted: bool = db.Column(db.Boolean(), default=False, nullable=False)

    # position in list of answer choices for question
    position: int = db.Column(db.Integer)

    # text of answer choice
    text: str = db.Column(db.String(ITEM_LENGTH))

    # original (unedited) text of answer choice
    original_text: str = db.Column(db.String(ITEM_LENGTH))

    # model's prediction on whether answer is correct or incorrect
    predicted_feedback: FeedbackTypes = db.Column(db.Enum(FeedbackTypes))

    # user's feedback on whether answer is correct or incorrect
    user_feedback: FeedbackTypes = db.Column(db.Enum(FeedbackTypes), server_default=FeedbackTypes.unselected.name)

    @hybrid_property
    def question(self):
        return db.session.query(Question).get(self.question_id)

    @hybrid_property
    def edited(self):
        if self.deleted:
            return True

        if self.original_text != self.text:
            return True

        if self.user_feedback != FeedbackTypes.unselected:
            return True

        return False

    @hybrid_method
    def check_ownership(self, user_id):
        if self.question.generation.user_id != user_id:
            raise Unauthorized("User doesn't have access to this answer choice")


# user-provided message about experience using quizicist
class Message(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("user.id"))

    message: str = db.Column(db.String(2500))
    message_type: MessageTypes = db.Column(db.Enum(MessageTypes))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    admin_expires = db.Column(db.DateTime)

    generations: List[Generation] = db.relationship("Generation", backref="user", cascade="all, delete-orphan")
    messages: List[Message] = db.relationship("Message", backref="user", cascade="all, delete-orphan")
