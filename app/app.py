from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from controllers import index
from routes.inicio_sesion import router as login_router
from routes.registro import router as registro_router
from routes.inicio_sesion import router as patient_router  # ✅ Rutas de pacientes
from routes.terapeuta_perfil import router as perfil_router  # ✅ Importamos el router de perfil
from routes.paciente_terapeuta_routes import router as paciente_terapeuta_router
from routes.historial_clinico_routes import router as historial_router  # ✅ Nueva ruta para historial clínico



app = FastAPI()

# 📌 Registramos las rutas de la interfaz (index.py)
app.include_router(index.router)

# 📌 Registramos las rutas de autenticación
app.include_router(login_router)
app.include_router(registro_router)
app.include_router(patient_router)  # ✅ Rutas para pacientes
app.include_router(perfil_router)   # ✅ Rutas para perfil de terapeuta
app.include_router(paciente_terapeuta_router)
app.include_router(historial_router)  # ✅ Agregamos la nueva ruta del historial clínico

# 📌 Montamos archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}

# ✅ Nueva ruta para servir principal.html
@app.get("/principal")
def serve_principal():
    return FileResponse("templates/principal.html")  # Asegúrate de que la ruta es correcta

@app.get("/perfil")
def serve_principal():
    return FileResponse("templates/perfil.html")  # Asegúrate de que la ruta es correcta


# ✅ Nueva ruta para servir el HTML de historial clínico
@app.get("/historial_clinico")
def serve_historial():
    return FileResponse("templates/historial.html")  # Asegúrate de que este archivo existe
