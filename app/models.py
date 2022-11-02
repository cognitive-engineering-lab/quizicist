from db import db

class Generation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String)
    questions = db.relationship("Question", backref="generation")


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    generation_id = db.Column(db.Integer, db.ForeignKey('generation.id'))

    question = db.Column(db.String)
    correct_answer = db.Column(db.String)
    option1 = db.Column(db.String)
    option2 = db.Column(db.String)
    option3 = db.Column(db.String)
    score = db.Column(db.Integer, nullable=True)
