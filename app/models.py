from dataclasses import dataclass
from typing import List
from blueprints.shared import PARSERS
from db import db
from flask import current_app
from lib.completion import complete, reroll_distractors
import os
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method


@dataclass
class Question(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    generation_id: int = db.Column(db.Integer, db.ForeignKey('generation.id'))

    question: str = db.Column(db.String)
    correct_answer: str = db.Column(db.String)
    option1: str = db.Column(db.String)
    option2: str = db.Column(db.String)
    option3: str = db.Column(db.String)
    shard: int = db.Column(db.Integer, default=0)
    score: int = db.Column(db.Integer, nullable=True)

    @hybrid_property
    def generation(self):
        return db.session.query("Generation").get(self.generation_id)

    @hybrid_method
    def reroll(self):
        with open(self.generation.upload_path) as upload:
            # TODO: remove parser requirement
            rerolled = reroll_distractors(upload, PARSERS["rust"], self)

        self.option1 = rerolled["options"][0]
        self.option2 = rerolled["options"][1]
        self.option3 = rerolled["options"][2]
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
            questions = complete(upload, parser)

        for question in questions:
            q = Question(
                generation_id=self.id,
                question=question["question"],
                correct_answer=question["correct"],
                option1=question["options"][0],
                option2=question["options"][1],
                option3=question["options"][2],
                shard=question["shard"],
                score=0,
            )
            db.session.add(q)

        # add questions to db
        db.session.commit()
