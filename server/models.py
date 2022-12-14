from __future__ import annotations
from blueprints.shared import PARSERS
from dataclasses import dataclass
from typing import List
from db import db
from flask import current_app
from flask_login import UserMixin
from lib.completion import complete, add_answer_choices
from lib.consts import FeedbackTypes
import os
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy.ext.orderinglist import OrderingList
from werkzeug.exceptions import Unauthorized
import types

# length of VARCHAR field for questions, answers, and filenames
ITEM_LENGTH=1000
FILENAME_LENGTH=400


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


class UpdateMixin:
    @hybrid_method
    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

        db.session.commit()


@dataclass
class Question(UpdateMixin, db.Model):
    __tablename__ = "question"

    id: int = db.Column(db.Integer, primary_key=True)
    generation_id: int = db.Column(db.Integer, db.ForeignKey("generation.id"))

    # text of question asked
    question: str = db.Column(db.String(ITEM_LENGTH))

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
        return db.session.query("Generation").get(self.generation_id)

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
class AnswerChoice(UpdateMixin, db.Model):
    __tablename__ = "answerchoice"

    id: int = db.Column(db.Integer, primary_key=True)
    question_id: int = db.Column(db.Integer, db.ForeignKey("question.id"))

    # position in list of answer choices for question
    position: int = db.Column(db.Integer)

    # text of answer choice
    text: str = db.Column(db.String(ITEM_LENGTH))

    # model's prediction on whether answer is correct or incorrect
    predicted_feedback: FeedbackTypes = db.Column(db.Enum(FeedbackTypes))

    # user's feedback on whether answer is correct or incorrect
    user_feedback: FeedbackTypes = db.Column(db.Enum(FeedbackTypes), server_default=FeedbackTypes.unselected.name)

    @hybrid_property
    def question(self):
        return db.session.query(Question).get(self.question_id)

    @hybrid_method
    def check_ownership(self, user_id):
        if self.question.generation.user_id != user_id:
            raise Unauthorized("User doesn't have access to this answer choice")


@dataclass
class Generation(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("user.id"))

    filename: str = db.Column(db.String(FILENAME_LENGTH))
    unique_filename: str = db.Column(db.String(FILENAME_LENGTH))
    questions: List[Question] = db.relationship("Question", backref="generation", cascade="all, delete-orphan")

    @hybrid_property
    def upload_path(cls):
        return os.path.join(current_app.config["UPLOAD_FOLDER"], cls.unique_filename)

    # TODO: remove need for parser
    @hybrid_method
    def add_questions(self, parser):
        # run gpt-3 completion
        with open(self.upload_path) as upload:
            shards = complete(upload, parser)

        for shard, questions in enumerate(shards):
            for question in questions:
                q = Question(
                    question=question["question"],
                    shard=shard,
                )
                self.questions.append(q)
                db.session.commit()

                # create correct answer choice
                correct = AnswerChoice(text=question["correct"], predicted_feedback=FeedbackTypes.correct)
                q.answers.append(correct)

                # create answer choices for incorrect choices
                for incorrect in question["incorrect"]:
                    distractor = AnswerChoice(text=incorrect, predicted_feedback=FeedbackTypes.incorrect)
                    q.answers.append(distractor)

        # add distractors to db
        db.session.commit()

    @hybrid_method
    def add_answer_choices(self, question: Question):
        with open(self.upload_path) as upload:
            # TODO: remove parser requirement
            custom_output = add_answer_choices(upload, PARSERS["rust"], question)
        
        for option in custom_output["options"]:
            choice = AnswerChoice(
                text=option["text"],
                predicted_feedback=option["predicted_feedback"]
            )
            question.answers.append(choice)

        db.session.commit()

    @hybrid_method
    def check_ownership(self, user_id):
        if self.user_id != user_id:
            raise Unauthorized("User doesn't have access to this quiz")


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    generations: List[Generation] = db.relationship("Generation", backref="user", cascade="all, delete-orphan")
