from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, Time
from database import get_db
from controllers.crear_sesiones_controller import create_sesion, get_sesiones
from datetime import date, datetime  # ✅ Importamos datetime
from models.crear_sesiones_models import Sesion
import pytz  # 📌 Necesario para manejar zonas horarias correctamente

router = APIRouter()

# 📌 Crear sesión

@router.post("/sesiones/")
def add_sesion(id_paciente: int, descripcion: str, fecha: date, hora: str, db: Session = Depends(get_db)):
    try:
        hora_obj = datetime.strptime(hora, "%H:%M").time()

        # ✅ Ajustar la fecha del servidor a la zona horaria correcta
        zona_horaria_usuario = pytz.timezone("America/Mexico_City")  # 🔄 Ajusta si es necesario
        fecha_actual = datetime.now(zona_horaria_usuario).date()

        print(f"📌 Fecha actual en el servidor (Zona Local): {fecha_actual}")
        print(f"📌 Fecha seleccionada por el usuario: {fecha}")

        # ✅ Validación de fecha sin problemas de zona horaria
        if fecha < fecha_actual:
            print("❌ ERROR: La fecha seleccionada está en el pasado.")
            raise HTTPException(status_code=400, detail="No puedes crear sesiones en fechas pasadas.")

        # ✅ Convertir `fecha` y `hora` a `datetime`
        fecha_hora = datetime.combine(fecha, hora_obj)

        # ✅ Validar que no haya una sesión en la misma fecha y hora
        sesion_existente = db.query(Sesion).filter(
            cast(Sesion.fecha_inicio, Date) == fecha_hora.date(),  # Convertimos a Date para comparación
            cast(Sesion.hora_inicio, Time) == fecha_hora.time()  # Convertimos a Time para evitar errores
        ).first()

        if sesion_existente:
            print("❌ ERROR: Ya existe una sesión en esa fecha y hora.")
            raise HTTPException(status_code=400, detail="Ya existe una sesión programada en esa fecha y hora.")

        return create_sesion(db, id_paciente, descripcion, fecha, hora_obj)

    except ValueError as e:
        print(f"❌ ERROR: Formato de hora incorrecto - {e}")
        raise HTTPException(status_code=400, detail="Formato de hora inválido. Usa HH:MM")
    
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")






@router.get("/sesiones/")
def list_sesiones(
    id_paciente: int = Query(..., alias="id_paciente"),
    page: int = Query(1, alias="page"),
    per_page: int = Query(4, alias="per_page"),  # ✅ Agregado
    db: Session = Depends(get_db)
):
    return get_sesiones(db, id_paciente, page, per_page)  # ✅ Pasamos per_page correctamente