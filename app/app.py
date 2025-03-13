from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from controllers import index
from routes.inicio_sesion import router as login_router
from routes.registro import router as registro_router
from routes.inicio_sesion import router as patient_router  
from routes.terapeuta_perfil import router as perfil_router  
from routes.paciente_terapeuta_routes import router as paciente_terapeuta_router
from routes.historial_clinico_routes import router as historial_router  
from routes.crear_sesiones_routes import router as crear_sesiones_routes
from routes.ejercicios_routes import router as niveles_router
from routes.dispositivos_routes import router as dispositivos_routes



app = FastAPI()

app.include_router(index.router)
app.include_router(login_router)
app.include_router(registro_router)
app.include_router(patient_router) 
app.include_router(perfil_router)   
app.include_router(paciente_terapeuta_router)
app.include_router(historial_router)  
app.include_router(crear_sesiones_routes)
app.include_router(niveles_router, prefix="/api")
app.include_router(dispositivos_routes)

# 📌 Montamos archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}

# ✅ Nueva ruta para servir principal.html
@app.get("/principal")
def serve_principal():
    return FileResponse("templates/principal.html")  

@app.get("/perfil")
def serve_principal():
    return FileResponse("templates/perfil.html") 


# ✅ Nueva ruta para servir el HTML de historial clínico
@app.get("/historial_clinico")
def serve_historial():
    return FileResponse("templates/historial.html")  

@app.get("/sesiones")
def serve_sesiones():
    return FileResponse("templates/sesiones.html") 

@app.get("/niveles_ejercicios")
def serve_niveles():
    return FileResponse("templates/ejercicios.html")

@app.get("/dispositivos")
def serve_niveles():
    return FileResponse("templates/dispositivos.html")
