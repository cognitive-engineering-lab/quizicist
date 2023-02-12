from transformers import GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

def extract_chunk_info(chunk):
    tokens = tokenizer(chunk)["input_ids"]

    return {
        "text": chunk,
        "tokens": len(tokens),
    }


def parse_text(content):
    content = content.read()

    # chunk text by newlines
    delimiter = "\n"
    chunks = [chunk + delimiter for chunk in content.split(delimiter)]

    return list(map(extract_chunk_info, chunks))
