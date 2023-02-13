# quizicist Gunicorn configuration file
bind = "127.0.0.1:8000"
backlog = 2048

workers = 4
worker_class = "gevent"
worker_connections = 1000
timeout = 180
keepalive = 2

daemon = True
