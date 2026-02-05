from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    SECRET_KEY: str
    DB_NAME: str = "plant_db"
    
    # Email settings (mocked defaults for demo)
    SMTP_SERVER: str = "smtp.mock.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "admin@example.com"
    SMTP_PASSWORD: str = "secret"

settings = Settings()