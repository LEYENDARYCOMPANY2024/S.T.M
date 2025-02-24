from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from models.terapeutas import autenticar_terapeuta

# Configuramos las plantillas
templates = Jinja2Templates(directory="templates")

# Creamos un enrutador
router = APIRouter()

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 📌 Ruta para mostrar la página de login
@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# 📌 Ruta para procesar el formulario de login
@router.post("/login")
async def login_action(
    nombre_usuario: str = Form(...),  # 🔹 Usamos Form() para recibir datos del formulario
    contrasena: str = Form(...)
):
    resultado = autenticar_terapeuta(nombre_usuario, contrasena)
    if "error" in resultado:
        raise HTTPException(status_code=401, detail=resultado["error"])
    
    return RedirectResponse(url="/", status_code=303)  # 🔹 Redirige al usuario tras iniciar sesión
