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
$ sudo apt-get install memcached
$ python -m venv quiz-env # create quiz-env virtual environment
$ source quiz-env/bin/activate
$ pip install wheel
$ cd lib && pip install -e . && cd ..
$ cd site && pip install --no-cache-dir -r requirements.txt # install dependencies without cache (helps low-RAM VMs)
```

### Environment

The production server `.env` file contains different variables from the dev file:
```
ENV=prod
FLASK_SECRET=<secure generated key>

RUST_BOOK_PATH=<path/to/rust/book>
OPENAI_SECRET_KEY=<production OpenAI secret>

MYSQL_USERNAME=<MySQL username>
MYSQL_PASSWORD=<MySQL password>
MYSQL_HOST=<MySQL host, should be localhost>
MYSQL_DB=<MySQL database>
```

### Running the server

```shell
$ cd site
$ sudo systemctl start memcached # start memcached to store rate-limiting data
$ gunicorn -c gunicorn_config.py "backend.main:app" --log-file=gunicorn.log # start app with production WSGI container
$ caddy start # bind caddy to local app
```

### Stopping the server

```shell
$ sudo systemctl stop memcached
$ pkill gunicorn
$ caddy stop
```
