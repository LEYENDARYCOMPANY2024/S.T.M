from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from controllers.crear_sesiones_controller import create_sesion, get_sesiones
from datetime import date, time

router = APIRouter()

# 📌 Crear sesión
@router.post("/sesiones/")
def add_sesion(id_paciente: int, descripcion: str, fecha: date, hora: time, db: Session = Depends(get_db)):
    return create_sesion(db, id_paciente, descripcion, fecha, hora)

# 📌 Obtener sesiones con paginación (4 por página)
@router.get("/sesiones/")
def list_sesiones(page: int = Query(1, alias="page"), db: Session = Depends(get_db)):
    return get_sesiones(db, page, 4)  # Mostramos 4 por página
