import os

db_host = os.getenv("MYSQL_HOST", "localhost")  # default to localhost if not set
db_user = os.getenv("MYSQL_USER", "root")
db_password = os.getenv("MYSQL_PASSWORD", "Geslo123")
db_name = os.getenv("MYSQL_DATABASE", "testdb")

# Build the connection URL
DATABASE_URL = f"mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}"
