from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from controllers.terapeuta_controller import registro_terapeuta, login

# Configuramos las plantillas
templates = Jinja2Templates(directory="templates")

# Creamos un enrutador
router = APIRouter()

# Define las rutas relacionadas con el terapeuta
router.add_api_route("/registro", registro_terapeuta, methods=["POST"])
router.add_api_route("/login", login, methods=["POST"])

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})