from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Configuración de FastAPI
app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Servir archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def main():
    with open("templates/subir_nivel_ejercicio.html", "r") as file:
        return HTMLResponse(file.read())

@app.post("/subir")
async def subir_datos(
    nombre_nivel: str = Form(...),
    descripcion_nivel: str = Form(...),
    orden_nivel: int = Form(...),
    nombre_ejercicio: str = Form(...),
    instrucciones: str = Form(...),
    video_url: str = Form(...)  # 🔥 Ahora se envía una URL en lugar de un archivo
):
    db = SessionLocal()

    try:
        # Insertar nivel
        nivel_result = db.execute(
            text("INSERT INTO niveles (nombre_nivel, descripcion, orden) VALUES (:nombre_nivel, :descripcion_nivel, :orden_nivel) RETURNING id_nivel"),
            {"nombre_nivel": nombre_nivel, "descripcion_nivel": descripcion_nivel, "orden_nivel": orden_nivel}
        )
        nivel_id = nivel_result.fetchone()[0]

        # Insertar ejercicio con la URL de YouTube
        ejercicio_result = db.execute(
            text("INSERT INTO ejercicios (nom_ejercicio, instrucciones, video_url) VALUES (:nombre_ejercicio, :instrucciones, :video_url) RETURNING id_ejercicio"),
            {"nombre_ejercicio": nombre_ejercicio, "instrucciones": instrucciones, "video_url": video_url}
        )
        ejercicio_id = ejercicio_result.fetchone()[0]

        # Relacionar el ejercicio con el nivel
        db.execute(
            text("INSERT INTO niveles_ejercicios (id_nivel_fk, id_ejercicio_fk) VALUES (:id_nivel, :id_ejercicio)"),
            {"id_nivel": nivel_id, "id_ejercicio": ejercicio_id}
        )

        db.commit()  # Confirmar los cambios

    except Exception as e:
        db.rollback()  # Revertir cambios en caso de error
        return {"error": f"Error al insertar en la base de datos: {str(e)}"}

    finally:
        db.close()  # Cerrar sesión

    return {"message": "✅ Nivel y ejercicio subidos correctamente con YouTube URL"}
