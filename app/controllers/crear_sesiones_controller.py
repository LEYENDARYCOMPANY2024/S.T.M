from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion, PacienteSesion
from models.historial_progreso import HistorialProgreso
from models.terapeutas import Terapeuta, TerapeutaPaciente
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

    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    codigo_unico = paciente.codigo if paciente else None

    sesiones_query = (
        db.query(Sesion, Terapeuta, PacienteSesion)
        .join(PacienteSesion, Sesion.id_sesion == PacienteSesion.id_sesion_ps_fk)
        .join(Terapeuta, PacienteSesion.id_terapeuta_fk == Terapeuta.id_terapeuta)
        .filter(PacienteSesion.id_paciente_ps_fk == id_paciente)
    )

    if not codigo_unico:
        sesiones_query = sesiones_query.filter(PacienteSesion.id_terapeuta_fk == id_terapeuta_actual)

    sesiones_query = sesiones_query.order_by(Sesion.fecha_inicio.desc(), Sesion.hora_inicio).all()

    sesiones_por_terapeuta = {}

    for sesion, terapeuta, _ in sesiones_query:
        id_terapeuta = terapeuta.id_terapeuta

        if id_terapeuta not in sesiones_por_terapeuta:
            # Buscar la relación pivote terapeuta-paciente
            tp_rel = (
                db.query(TerapeutaPaciente.id_terapeuta_paciente)
                .filter(
                    TerapeutaPaciente.id_paciente_tp_fk == id_paciente,
                    TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta
                )
                .first()
            )
            
            if not tp_rel:
                print(f"❌ No se encontró relación terapeuta-paciente para terapeuta {id_terapeuta} y paciente {id_paciente}")
            else:
                print(f"✅ Relación encontrada: id_terapeuta_paciente = {tp_rel.id_terapeuta_paciente}")

            historial = None

            if tp_rel:
                historial = (
                    db.query(HistorialProgreso)
                    .filter(HistorialProgreso.id_terapeuta_paciente_fk == tp_rel.id_terapeuta_paciente)
                    .order_by(HistorialProgreso.fecha_inicio.desc())
                    .first()
                )

                if historial:
                    print(f"📅 Historial encontrado → inicio: {historial.fecha_inicio}, fin: {historial.fecha_fin}")
                else:
                    print(f"⚠️ No hay historial para la relación con id {tp_rel.id_terapeuta_paciente}")
            else:
                print(f"❌ No se encontró relación terapeuta-paciente para terapeuta {id_terapeuta} y paciente {id_paciente}")


            fecha_inicio = historial.fecha_inicio.strftime("%Y-%m-%d") if historial else "Sin registro"
            fecha_fin = (
                "Aún no finaliza" if historial and historial.fecha_fin is None and id_terapeuta == id_terapeuta_actual
                else (historial.fecha_fin.strftime("%Y-%m-%d") if historial and historial.fecha_fin else "Sin registro")
            )

            sesiones_por_terapeuta[id_terapeuta] = {
                "terapeuta": f"{terapeuta.nombre} {terapeuta.primer_apellido}",
                "id_terapeuta": id_terapeuta,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
                "sesiones": []
            }

        sesiones_por_terapeuta[id_terapeuta]["sesiones"].append({
            "id_sesion": sesion.id_sesion,
            "descripcion_sesion": sesion.descripcion_sesion,
            "fecha_inicio": sesion.fecha_inicio.strftime("%Y-%m-%d"),
            "hora_inicio": sesion.hora_inicio.strftime("%I:%M %p")
        })

    # Paginación
    terapeutas_paginados = list(sesiones_por_terapeuta.values())
    total_pages = (len(terapeutas_paginados) + per_page - 1) // per_page
    start = (page - 1) * per_page
    end = start + per_page

    return {
        "terapeutas": terapeutas_paginados[start:end],
        "total_pages": total_pages,
        "page": page
    }



