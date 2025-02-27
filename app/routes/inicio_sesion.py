from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
from controllers.iniciar_sesion import autenticar_terapeuta

router = APIRouter()

@router.post("/login")
async def login_action(nombre_usuario: str = Form(...), contrasena: str = Form(...)):
    try:
        resultado = autenticar_terapeuta(nombre_usuario, contrasena)

        if "error" in resultado:
            return JSONResponse(status_code=401, content={"error": resultado["error"]})

        return JSONResponse(status_code=200, content={
            "message": "✅ Inicio de sesión exitoso",
            "terapeuta": resultado["terapeuta"],
            "token": resultado["token"]
        })
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"❌ Error interno del servidor: {str(e)}"})
