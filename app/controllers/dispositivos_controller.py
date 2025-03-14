from sqlalchemy.orm import Session
from models.dispositivos_models import DispositivoIOT, PacienteDispositivo
from fastapi import HTTPException

def obtener_dispositivos(db: Session, paciente_id: int):
    dispositivos = db.query(DispositivoIOT).all()
    
    dispositivos_con_estado = []
    for dispositivo in dispositivos:
        # Buscar el estado del dispositivo para el paciente específico
        paciente_dispositivo = (
            db.query(PacienteDispositivo)
            .filter(
                PacienteDispositivo.id_paciente_pd_fk == paciente_id,
                PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
            )
            .first()
        )

        # Si el dispositivo no está registrado en `paciente_dispositivo`, se marca como 'desactivado' por defecto
        estado = paciente_dispositivo.estado_dispositivo if paciente_dispositivo else "desactivado"

        # Agregar estado personalizado para este paciente
        dispositivos_con_estado.append({
            "id_dispositivo": dispositivo.id_dispositivo,
            "nombre_dispositivo": dispositivo.nombre_dispositivo,
            "fecha_registro": dispositivo.fecha_registro,
            "tipo_de_dispositivo": dispositivo.tipo_de_dispositivo,
            "uuid": dispositivo.uuid,
            "estado_dispositivo": estado
        })

    return dispositivos_con_estado


def cambiar_estado_dispositivo(db: Session, dispositivo_id: int, paciente_id: int):
    # Verificar si el dispositivo existe en dispositivos_iot
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.id_dispositivo == dispositivo_id).first()
    
    if not dispositivo:
        raise HTTPException(status_code=404, detail="El dispositivo no existe")

    # Buscar si ya hay una relación entre el paciente y el dispositivo
    paciente_dispositivo = (
        db.query(PacienteDispositivo)
        .filter(
            PacienteDispositivo.id_paciente_pd_fk == paciente_id,
            PacienteDispositivo.id_dispositivo_pd_fk == dispositivo_id
        )
        .first()
    )

    if not paciente_dispositivo:
        # Si no existe, lo insertamos con estado "activado" por defecto
        paciente_dispositivo = PacienteDispositivo(
            id_paciente_pd_fk=paciente_id,
            id_dispositivo_pd_fk=dispositivo_id,
            estado_dispositivo="activado"
        )
        db.add(paciente_dispositivo)
        nuevo_estado = "activado"
    else:
        # Si ya existe, alternar el estado
        nuevo_estado = "activado" if paciente_dispositivo.estado_dispositivo == "desactivado" else "desactivado"
        paciente_dispositivo.estado_dispositivo = nuevo_estado

    db.commit()
    db.refresh(paciente_dispositivo)
    
    return {"id_dispositivo": dispositivo_id, "estado": nuevo_estado}

