from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion, PacienteSesion
from datetime import datetime  # ⬅️ Importamos `datetime`

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


    

# 📌 Obtener sesiones con formato de hora más claro
def get_sesiones(db: Session, page: int, per_page: int):
    offset = (page - 1) * per_page
    sesiones = db.query(Sesion).offset(offset).limit(per_page).all()

    # ✅ Convertir la hora a formato "HH:MM"
    sesiones_formateadas = []
    for sesion in sesiones:
        sesiones_formateadas.append({
            "id_sesion": sesion.id_sesion,
            "descripcion_sesion": sesion.descripcion_sesion,
            "fecha_inicio": sesion.fecha_inicio.strftime("%Y-%m-%d"),
            "hora_inicio": sesion.hora_inicio.strftime("%H:%M")  # ✅ Solo "HH:MM"
        })

    return {"sesiones": sesiones_formateadas, "page": page, "per_page": per_page}

