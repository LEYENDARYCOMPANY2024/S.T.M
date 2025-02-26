from fastapi import FastAPI
from fastapi.responses import FileResponse
from controllers import index
from routes.inicio_sesion import router as login_router
from routes.registro import router as registro_router
from routes.inicio_sesion import router as patient_router  # ✅ Agregar rutas de pacientes
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 📌 Registramos las rutas de la interfaz (index.py)
app.include_router(index.router)

# 📌 Registramos las rutas de autenticación
app.include_router(login_router)
app.include_router(registro_router)
app.include_router(patient_router)  # ✅ Agregamos rutas para pacientes

# 📌 Montamos archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}

# ✅ Nueva ruta para servir principal.html
@app.get("/principal")
def serve_principal():
    return FileResponse("templates/principal.html")  # Asegúrate de que la ruta es correcta
