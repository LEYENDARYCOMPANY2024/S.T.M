import jwt
import os
from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ✅ Cargar variables de entorno desde `.env`
load_dotenv()

# ✅ Obtener `SECRET_KEY` desde `.env`
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
security = HTTPBearer()


def verificar_token(authorization: HTTPAuthorizationCredentials = Security(security)):
    token = authorization.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # ✅ Verificar si el token ha expirado
        import datetime
        current_time = datetime.datetime.utcnow().timestamp()
        if payload["exp"] < current_time:
            raise HTTPException(status_code=401, detail="❌ Token expirado")

        return payload["sub"]  # ID del terapeuta
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="❌ Token expirado")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"❌ Token inválido: {str(e)}")
