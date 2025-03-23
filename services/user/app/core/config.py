import os
from dotenv import load_dotenv

load_dotenv()

# For local development, the default host is localhost.
# In CI (GitHub Actions), the service name should be used (mysql).
db_host = os.getenv("MYSQL_HOST", "localhost")  # default to localhost if not set
db_user = os.getenv("MYSQL_USER", "root")
db_password = os.getenv("MYSQL_PASSWORD", "Geslo123")
db_name = os.getenv("MYSQL_DATABASE", "user")

# Build the connection URL
DATABASE_URL = f"mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}"
JWT_SECRET = os.getenv("JWT_SECRET", "e8694db72620093716a6c0a54ce7936e4bfc134da762595b7599092017c54872")