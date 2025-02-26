from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import RedirectResponse
from controllers.iniciar_sesion import autenticar_terapeuta

router = APIRouter()

# 📌 Ruta para procesar el formulario de login
@router.post("/login")
async def login_action(nombre_usuario: str = Form(...), contrasena: str = Form(...)):
    resultado = autenticar_terapeuta(nombre_usuario, contrasena)
    if "error" in resultado:
        raise HTTPException(status_code=401, detail=resultado["error"])
    
    return RedirectResponse(url="/principal", status_code=303)
