from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import RedirectResponse
from controllers.registro import registrar_terapeuta

router = APIRouter()

from models.terapeutas import TerapeutaBase

@router.post("/registro")
async def registro_action(
    nombre_usuario: str = Form(...), nombre: str = Form(...),
    primer_apellido: str = Form(...), segundo_apellido: str = Form(None),
    correo: str = Form(...), contrasena: str = Form(...)
):
    terapeuta_data = TerapeutaBase(
        nombre_usuario=nombre_usuario,
        nombre=nombre,
        primer_apellido=primer_apellido,
        segundo_apellido=segundo_apellido,
        correo=correo,
        contrasena=contrasena
    )
    
    resultado = registrar_terapeuta(terapeuta_data)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    
    return RedirectResponse(url="/login", status_code=303)

