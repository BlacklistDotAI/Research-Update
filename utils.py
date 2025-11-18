#Presigned URL + JWT helpers
import jwt
from datetime import datetime, timedelta

def generate_presigned_url(object_path: str, expires_in: int = 3600) -> str:
    return f"https://fake-storage.com/{object_path}?expires_in={expires_in}"

SECRET_KEY = "secretkey123"
ALGORITHM = "HS256"

def create_jwt_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token