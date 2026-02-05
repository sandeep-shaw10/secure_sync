import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

# Security Scheme
security = HTTPBearer()

def create_verification_token(email: str):
    """Generates a JWT valid for 10 minutes"""
    expiration = datetime.utcnow() + timedelta(minutes=10)
    payload = {"sub": email, "exp": expiration}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token

def decode_verification_token(token: str):
    """Decodes token, returns email if valid, None if expired/invalid"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def send_verification_email(to_email: str, token: str):
    link = f"http://localhost:8000/verify?token={token}"
    
    # For Production: Use smtplib or fastapi-mail
    # For Demo: We print the link to the Docker logs
    print("\n" + "="*60)
    print(f"📧 EMAIL SIMULATION TO: {to_email}")
    print(f"🔗 SECURE LINK (Valid 10 mins): {link}")
    print("="*60 + "\n")
    return True

# --- NEW ADMIN AUTH FUNCTIONS ---

def create_admin_token(username: str):
    """Generates a Token valid for 24 hours"""
    expiration = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "sub": username, 
        "role": "admin", 
        "exp": expiration
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token

def get_current_admin(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency that validates the token. 
    Use this to protect routes.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")