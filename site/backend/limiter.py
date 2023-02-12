from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# use IP as default rate limiting key
limiter = Limiter(key_func=get_remote_address)
