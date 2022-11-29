## Deployment

Instructions for deploying to a Google Compute Engine VM.

### Installation

1. Install [Caddy](https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
2. Allow Caddy to bind to privileged ports:
```shell
$ sudo setcap CAP_NET_BIND_SERVICE=+eip $(which caddy)
```
3. Install server dependencies:
```shell
$ sudo apt-get install libmysqlclient-dev
$ python -m venv quiz-env # create quiz-env virtual environment
$ source quiz-env/bin/activate
$ pip install --no-cache-dir -r requirements.txt # install dependencies without cache (helps low-RAM VMs)
```

### Environment

The production server `.env` file contains different variables from the dev file:
```
ENV=prod

RUST_BOOK_PATH=<path/to/rust/book>
OPENAI_SECRET_KEY=<production OpenAI secret>

MYSQL_USERNAME=<MySQL username>
MYSQL_PASSWORD=<MySQL password>
MYSQL_HOST=<MySQL host, should be localhost>
MYSQL_DB=<MySQL database>
```

### Running the server

```shell
$ cd server
$ gunicorn -w 4 'main:app' --daemon # start app with production WSGI container
$ caddy reverse-proxy --from api.quizici.st --to localhost:8000 # bind caddy to local app
```

### Stopping the server

```shell
$ pkill gunicorn
$ caddy stop
```
