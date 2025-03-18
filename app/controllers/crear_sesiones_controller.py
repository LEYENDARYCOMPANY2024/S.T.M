from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion, PacienteSesion
from datetime import datetime  # ⬅️ Importamos `datetime`
from sqlalchemy import func
# 📌 Crear sesión
def create_sesion(db: Session, id_paciente: int, descripcion: str, fecha, hora: str):
    # ✅ Convertimos `fecha` y `hora` en un solo `datetime`
    fecha_hora = datetime.combine(fecha, hora)  # `hora` ya es `datetime.time`

    new_sesion = Sesion(
        descripcion_sesion=descripcion,
        fecha_inicio=fecha,
        hora_inicio=fecha_hora  # ✅ Ahora es `datetime`
    )
    db.add(new_sesion)
    db.commit()
    db.refresh(new_sesion)

    paciente_sesion = PacienteSesion(
        id_paciente_ps_fk=id_paciente,
        id_sesion_ps_fk=new_sesion.id_sesion
    )
    db.add(paciente_sesion)
    db.commit()

    return {"message": "Sesión creada exitosamente", "id_sesion": new_sesion.id_sesion}


    

# 📌 Obtener sesiones del paciente con paginación
def get_sesiones(db: Session, id_paciente: int, page: int, per_page: int):
    offset = (page - 1) * per_page

    sesiones = (
        db.query(Sesion)
        .join(PacienteSesion, Sesion.id_sesion == PacienteSesion.id_sesion_ps_fk)
        .filter(PacienteSesion.id_paciente_ps_fk == id_paciente)  # 🔴 Filtrar por paciente
        .order_by(Sesion.fecha_inicio.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    # ✅ Convertir la hora a formato "hh:mm AM/PM"
    sesiones_formateadas = []
    for sesion in sesiones:
        hora_12hrs = sesion.hora_inicio.strftime("%I:%M %p")  # 🔹 Formato de 12 horas (AM/PM)

        sesiones_formateadas.append({
            "id_sesion": sesion.id_sesion,
            "descripcion_sesion": sesion.descripcion_sesion,
            "fecha_inicio": sesion.fecha_inicio.strftime("%Y-%m-%d"),
            "hora_inicio": hora_12hrs  # ✅ Ahora se mostrará en 12 horas
        })

    # 📌 Obtener el total de sesiones del paciente
    total_sesiones = (
        db.query(func.count(Sesion.id_sesion))
        .join(PacienteSesion, Sesion.id_sesion == PacienteSesion.id_sesion_ps_fk)
        .filter(PacienteSesion.id_paciente_ps_fk == id_paciente)
        .scalar()
    )

    total_pages = (total_sesiones // per_page) + (1 if total_sesiones % per_page > 0 else 0)

    return {
        "sesiones": sesiones_formateadas,
        "total_pages": total_pages,
        "page": page
    }
