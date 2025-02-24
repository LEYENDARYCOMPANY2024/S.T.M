from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
from controllers.registro import registrar_terapeuta
from models.terapeutas import TerapeutaBase

router = APIRouter()

@router.post("/registro")
async def registro_action(
    nombre_usuario: str = Form(...), nombre: str = Form(...),
    primer_apellido: str = Form(...), segundo_apellido: str = Form(None),
    correo: str = Form(...), contrasena: str = Form(...)
):
    # Crear el objeto TerapeutaBase
    terapeuta_data = TerapeutaBase(
        nombre_usuario=nombre_usuario,
        nombre=nombre,
        primer_apellido=primer_apellido,
        segundo_apellido=segundo_apellido,
        correo=correo,
        contrasena=contrasena
    )
    
    # Registrar el terapeuta en la base de datos
    resultado = registrar_terapeuta(terapeuta_data)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    
    # En lugar de redirigir, devolver un mensaje de éxito
    return JSONResponse({"message": "Registro exitoso. Redirigiendo a inicio de sesión."})
