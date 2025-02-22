from fastapi import FastAPI
from controllers import index  # Importamos las rutas
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(index.router)  # Registramos las rutas

app.mount("/static", StaticFiles(directory="static"), name="static") #esta linea obtiene los archivos de la carpeta static


@app.get("/")
def home():
    return {"message": "Bienvenido a la API"}
