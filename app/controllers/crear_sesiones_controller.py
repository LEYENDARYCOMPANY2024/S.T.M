from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion, PacienteSesion
from models.terapeutas import Terapeuta
from datetime import datetime
from sqlalchemy import func
from models.paciente_terapeuta_principal import Paciente

# Crear sesión
def create_sesion(db: Session, id_paciente: int, descripcion: str, fecha, hora: str, id_terapeuta: int):
    fecha_hora = datetime.combine(fecha, hora)

    new_sesion = Sesion(
        descripcion_sesion=descripcion,
        fecha_inicio=fecha,
        hora_inicio=fecha_hora
    )
    db.add(new_sesion)
    db.commit()
    db.refresh(new_sesion)

    paciente_sesion = PacienteSesion(
        id_paciente_ps_fk=id_paciente,
        id_sesion_ps_fk=new_sesion.id_sesion,
        id_terapeuta_fk=id_terapeuta
    )
    db.add(paciente_sesion)
    db.commit()

    return {"message": "Sesión creada exitosamente", "id_sesion": new_sesion.id_sesion}

# Obtener sesiones
def get_sesiones(db: Session, id_paciente: int, id_terapeuta_actual: int, page: int, per_page: int):
    # 🔥 Verificar si el paciente tiene un código único
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    codigo_unico = paciente.codigo if paciente else None  # ✅ Tomamos el código único

    sesiones_query = (
        db.query(Sesion, Terapeuta)
        .join(PacienteSesion, Sesion.id_sesion == PacienteSesion.id_sesion_ps_fk)
        .join(Terapeuta, PacienteSesion.id_terapeuta_fk == Terapeuta.id_terapeuta)
        .filter(PacienteSesion.id_paciente_ps_fk == id_paciente)
    )

    # 🔥 Si el paciente no tiene código único, solo mostrar sesiones del terapeuta actual
    if not codigo_unico:
        sesiones_query = sesiones_query.filter(PacienteSesion.id_terapeuta_fk == id_terapeuta_actual)

    sesiones_query = sesiones_query.order_by(Sesion.fecha_inicio, Sesion.hora_inicio).all()

    sesiones_por_terapeuta = {}
    for sesion, terapeuta in sesiones_query:
        id_terapeuta = terapeuta.id_terapeuta
        if id_terapeuta not in sesiones_por_terapeuta:
            sesiones_por_terapeuta[id_terapeuta] = {
                "terapeuta": f"{terapeuta.nombre} {terapeuta.primer_apellido}",
                "id_terapeuta": id_terapeuta,
                "sesiones": []
            }
        sesiones_por_terapeuta[id_terapeuta]["sesiones"].append({
            "id_sesion": sesion.id_sesion,
            "descripcion_sesion": sesion.descripcion_sesion,
            "fecha_inicio": sesion.fecha_inicio.strftime("%Y-%m-%d"),
            "hora_inicio": sesion.hora_inicio.strftime("%I:%M %p")
        })

    # 🔥 Convertimos a lista y aplicamos paginación por terapeuta
    terapeutas_paginados = list(sesiones_por_terapeuta.values())
    total_pages = (len(terapeutas_paginados) // per_page) + (1 if len(terapeutas_paginados) % per_page > 0 else 0)

    start = (page - 1) * per_page
    end = start + per_page
    terapeutas_paginados = terapeutas_paginados[start:end]

    return {
        "terapeutas": terapeutas_paginados,
        "total_pages": total_pages,
        "page": page
    }

