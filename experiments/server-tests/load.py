import aiohttp
import asyncio
import pathlib

BACKEND_URL = "http://localhost:8000"
API_URL = f"{BACKEND_URL}/api"
AUTH_URL = f"{BACKEND_URL}/auth"

NUM_REQUESTS = 20
NUM_QUESTIONS = 5
CONTENT_FILE = pathlib.Path(__file__).parent.resolve().parent.joinpath("plai/smol-reactivity.md")

# POST data for new quiz
with open(CONTENT_FILE) as f:
    content = f.read()

data = {
    "title": "Test quiz",
    "content": content,
    "count": NUM_QUESTIONS,
    "is_markdown": True,
}

# call /upload route
async def make_gpt_request(session: aiohttp.ClientSession):
    response = await session.post(f"{API_URL}/upload", json=data)
    result = await response.json()
    return result

async def main():
    async with aiohttp.ClientSession() as session:
        # authenticate
        await session.post(f"{AUTH_URL}/authenticate")

        tasks = []

        for _ in range(NUM_REQUESTS):
            tasks.append(make_gpt_request(session))

        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return results

if __name__ == "__main__":
    data = asyncio.run(main())

    for result in data:
        print(result)