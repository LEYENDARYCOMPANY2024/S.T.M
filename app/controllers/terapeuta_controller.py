from fastapi import APIRouter, HTTPException
from models.terapeutas import TerapeutaBase, registrar_terapeuta, autenticar_terapeuta

router = APIRouter()

# 📌 Endpoint para registrar terapeuta
@router.post("/registro", response_model=dict)
async def registro_terapeuta(terapeuta: TerapeutaBase):
    resultado = registrar_terapeuta(terapeuta)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado

# 📌 Endpoint para iniciar sesión
@router.post("/login", response_model=dict)
async def login(nombre_usuario: str, contrasena: str):
    resultado = autenticar_terapeuta(nombre_usuario, contrasena)
    if "error" in resultado:
        raise HTTPException(status_code=401, detail=resultado["error"])
    return resultado
