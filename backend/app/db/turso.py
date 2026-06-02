from libsql_client import create_client
from app.config import (
    TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN
)

client = create_client(
    url=TURSO_DATABASE_URL,
    auth_token=TURSO_AUTH_TOKEN
)