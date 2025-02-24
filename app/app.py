from fastapi import FastAPI
from controllers import index
from routes.inicio_sesion import router as login_router  # ✅ Usa un alias diferente
from routes.registro import router as registro_router  # ✅ Usa otro alias
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 📌 Registramos las rutas de la interfaz (index.py)
app.include_router(index.router)

# 📌 Registramos las rutas de autenticación
app.include_router(login_router)  # ✅ Rutas de inicio de sesión
app.include_router(registro_router)  # ✅ Rutas de registro

# 📌 Montamos archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}
