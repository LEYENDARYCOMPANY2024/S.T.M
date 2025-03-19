from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, Time
from database import get_db
from controllers.crear_sesiones_controller import create_sesion, get_sesiones
from datetime import date, datetime  # ✅ Importamos datetime
from models.crear_sesiones_models import Sesion
import pytz  # 📌 Necesario para manejar zonas horarias correctamente

router = APIRouter()

@router.post("/sesiones/")
def add_sesion(id_paciente: int, descripcion: str, fecha: date, hora: str, id_terapeuta: int, db: Session = Depends(get_db)):
    try:
        hora_obj = datetime.strptime(hora, "%H:%M").time()
        zona_horaria_usuario = pytz.timezone("America/Mexico_City")
        fecha_actual = datetime.now(zona_horaria_usuario).date()

        if fecha < fecha_actual:
            raise HTTPException(status_code=400, detail="No puedes crear sesiones en fechas pasadas.")

        fecha_hora = datetime.combine(fecha, hora_obj)

        sesion_existente = db.query(Sesion).filter(
            cast(Sesion.fecha_inicio, Date) == fecha_hora.date(),
            cast(Sesion.hora_inicio, Time) == fecha_hora.time()
        ).first()

        if sesion_existente:
            raise HTTPException(status_code=400, detail="Ya existe una sesión en esa fecha y hora.")

        return create_sesion(db, id_paciente, descripcion, fecha, hora_obj, id_terapeuta)

    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de hora inválido. Usa HH:MM")

@router.get("/sesiones/")
def list_sesiones(
    id_paciente: int = Query(...),
    id_terapeuta_actual: int = Query(...),  # 🔥 Nuevo parámetro
    page: int = Query(1),
    per_page: int = Query(4),
    db: Session = Depends(get_db)
):
    return get_sesiones(db, id_paciente, id_terapeuta_actual, page, per_page)