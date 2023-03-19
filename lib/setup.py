from setuptools import setup

setup(
    name="quizicist",
    version="0.1.0",
    packages=["quizicist"],
    install_requires=[
        "openai==0.27.2", 
        "python-dotenv==0.21.0", 
        "mistletoe==0.9.0",
        "transformers==4.22.1",
        "beautifulsoup4==4.11.1",
        "lxml==4.9.1",
    ],
    extras_require={
        "dev": [
            "pytest==7.2.2"
        ]
    }
)