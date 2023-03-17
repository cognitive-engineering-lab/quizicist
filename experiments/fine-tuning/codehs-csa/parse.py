import json
import csv

def serialize_completion(question, correct, incorrect):
    completion = f"Question: {question}"
    completion += f"\nCorrect: {correct}"

    for answer in incorrect:
        completion += f"\nIncorrect: {answer}"
    
    completion += "END"

    return completion

items = []

with open("questions.csv", "r") as f:
    reader = csv.DictReader(f)

    for line in reader:
        prompt = line["text"] + "\n\n###\n\n"

        incorrect = [v for k, v in line.items() if k.startswith("incorrect")]
        completion = serialize_completion(line["question"], line["correct"], incorrect)

        items.append({
            "prompt": prompt,
            "completion": completion,
        })

with open("questions.json", "w+") as f:
    json.dump(items, f)
