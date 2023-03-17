"""

Split whole-textbook PDF into separate PDFs for each chapter.

"""

import pandas
from pathlib import Path
from PyPDF2 import PdfWriter, PdfReader

# load chapters
chapters = pandas.read_csv("chapters.csv")

# group each chapter by textbook
textbooks = chapters.groupby("book")

# open textbook PDF
for textbook, group in textbooks:
    textbook_path = Path("textbooks") / f"{textbook}.pdf"
    inputpdf = PdfReader(open(textbook_path, "rb"))
    
    for chapter in group.itertuples():
        output = PdfWriter()
        output_dir = Path(textbook)
        output_dir.mkdir(parents=True, exist_ok=True)

        # create individual PDF for chapter
        for page in range(chapter.start - 1, chapter.end):
            output.add_page(inputpdf.pages[page])

        with open(output_dir / f"{chapter.chapter}.pdf", "wb+") as output_stream:
            output.write(output_stream)
