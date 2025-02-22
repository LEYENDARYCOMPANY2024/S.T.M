from fastapi import FastAPI
from controllers import index  # Importamos las rutas

app = FastAPI()

app.include_router(index.router)  # Registramos las rutas

@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}
