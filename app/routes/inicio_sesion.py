from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from controllers.iniciar_sesion import autenticar_terapeuta
<<<<<<< HEAD

router = APIRouter()

# 📌 Modelo para recibir `JSON` en lugar de `FormData`
class LoginRequest(BaseModel):
    nombre_usuario: str
    contrasena: str

=======
from models.terapeutas import LoginRequest

router = APIRouter()

>>>>>>> pruebas
@router.post("/login")
async def login_action(request: LoginRequest):
    resultado = autenticar_terapeuta(request.nombre_usuario, request.contrasena)
    
    if "error" in resultado:
        raise HTTPException(status_code=401, detail=resultado["error"])

    return {
        "message": "✅ Inicio de sesión exitoso",
        "terapeuta": resultado["terapeuta"],
        "token": resultado["token"]
    }
