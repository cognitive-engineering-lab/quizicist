from dataclasses import dataclass
from typing import List
from blueprints.shared import PARSERS
from db import db
from flask import current_app
from lib.completion import complete, reroll_distractors
import os
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method


class UpdateMixin:
    @hybrid_method
    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

        db.session.commit()


@dataclass
class Distractor(UpdateMixin, db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    question_id: int = db.Column(db.Integer, db.ForeignKey('question.id'))

    text: str = db.Column(db.String)
    locked: bool = db.Column(db.Boolean)


@dataclass
class Question(UpdateMixin, db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    generation_id: int = db.Column(db.Integer, db.ForeignKey('generation.id'))

    question: str = db.Column(db.String)
    correct_answer: str = db.Column(db.String)
    distractors: List[Distractor] = db.relationship("Distractor", backref="question")

    shard: int = db.Column(db.Integer, default=0)
    score: int = db.Column(db.Integer, nullable=True)

    @hybrid_property
    def generation(self):
        return db.session.query("Generation").get(self.generation_id)

    @hybrid_method
    def update(self, **kwargs):
        if "distractors" in kwargs:
            for current, new in zip(self.distractors, kwargs["distractors"]):
                current.update(**new)

        kwargs.pop("distractors", None)
        super(Question, self).update(**kwargs)

    @hybrid_method
    def fill_distractors(self):
        # TODO: is there a better way to efficiently create distractor rows?
        # TODO: create const for NUM_DISTRACTORS
        for _ in range(3):
            d = Distractor(question_id=self.id, text="", locked=False)
            db.session.add(d)

        db.session.commit()

    @hybrid_method
    def reroll(self):
        with open(self.generation.upload_path) as upload:
            # TODO: remove parser requirement
            rerolled = reroll_distractors(upload, PARSERS["rust"], self)

        for i, distractor in enumerate(self.distractors):
            distractor.text = rerolled["options"][i]

        db.session.commit()


@dataclass
class Generation(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    filename: str = db.Column(db.String)
    unique_filename: str = db.Column(db.String)
    questions: List[Question] = db.relationship("Question", backref="generation")

    @hybrid_property
    def upload_path(cls):
        return os.path.join(current_app.config['UPLOAD_FOLDER'], cls.unique_filename)

    # TODO: remove need for parser
    @hybrid_method
    def add_questions(self, parser):
        # run gpt-3 completion
        with open(self.upload_path) as upload:
            shards = complete(upload, parser)

        for shard, questions in enumerate(shards):
            for question in questions:
                q = Question(
                    generation_id=self.id,
                    question=question["question"],
                    correct_answer=question["correct"],
                    shard=shard,
                    score=0,
                )
                db.session.add(q)
                db.session.commit()

                for distractor in question["incorrect"]:
                    d = Distractor(question_id=q.id, text=distractor, locked=False)
                    db.session.add(d)

        # add distractors to db
        db.session.commit()
