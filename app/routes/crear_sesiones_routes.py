from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from controllers.crear_sesiones_controller import create_sesion, get_sesiones
from datetime import date, datetime  # ✅ Importamos datetime

router = APIRouter()

# 📌 Crear sesión
@router.post("/sesiones/")
def add_sesion(id_paciente: int, descripcion: str, fecha: date, hora: str, db: Session = Depends(get_db)):
    try:
        hora_obj = datetime.strptime(hora, "%H:%M").time()  # ✅ Convertimos a formato `time`
        return create_sesion(db, id_paciente, descripcion, fecha, hora_obj)
    except ValueError:
        return {"error": "Formato de hora inválido. Usa HH:MM"}


@router.get("/sesiones/")
def list_sesiones(
    id_paciente: int = Query(..., alias="id_paciente"),
    page: int = Query(1, alias="page"),
    per_page: int = Query(4, alias="per_page"),  # ✅ Agregado
    db: Session = Depends(get_db)
):
    return get_sesiones(db, id_paciente, page, per_page)  # ✅ Pasamos per_page correctamente
