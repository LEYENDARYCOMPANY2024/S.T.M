from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion, PacienteSesion

# 📌 Crear sesión
def create_sesion(db: Session, id_paciente: int, descripcion: str, fecha, hora):
    new_sesion = Sesion(
        descripcion_sesion=descripcion,
        fecha_inicio=fecha,
        hora_inicio=hora
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

    return {"message": "Sesión creada y vinculada al paciente", "id_sesion": new_sesion.id_sesion}

# 📌 Obtener sesiones con paginación
def get_sesiones(db: Session, page: int, per_page: int):
    offset = (page - 1) * per_page
    sesiones = db.query(Sesion).offset(offset).limit(per_page).all()
    return {"sesiones": sesiones, "page": page, "per_page": per_page}
