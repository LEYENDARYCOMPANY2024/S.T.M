from sqlalchemy.orm import Session
from models.dispositivos_models import DispositivoIOT, PacienteDispositivo, SesionDispositivo, EstadoDispositivoEnum
from fastapi import HTTPException

def obtener_dispositivos(db: Session, paciente_id: int):
    """
    Obtiene todos los dispositivos disponibles. 
    Si el dispositivo ya ha sido activado en una sesión por el paciente, devuelve su estado.
    """
    dispositivos = db.query(DispositivoIOT).all()  # Obtiene TODOS los dispositivos

    dispositivos_con_estado = []
    for dispositivo in dispositivos:
        # Buscar si el dispositivo ha sido activado en una sesión por este paciente
        sesion_dispositivo = (
            db.query(SesionDispositivo)
            .join(PacienteDispositivo, SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo)
            .filter(PacienteDispositivo.id_paciente_pd_fk == paciente_id,
                    SesionDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo)
            .first()
        )

        estado = "desactivado"  # Por defecto, todos los dispositivos están desactivados
        sesion_id = None

        if sesion_dispositivo:
            estado = sesion_dispositivo.estado_activado
            sesion_id = sesion_dispositivo.id_sesion_fk

        dispositivos_con_estado.append({
            "id_dispositivo": dispositivo.id_dispositivo,
            "nombre_dispositivo": dispositivo.nombre_dispositivo,
            "fecha_registro": dispositivo.fecha_registro,
            "tipo_de_dispositivo": dispositivo.tipo_de_dispositivo,
            "uuid": dispositivo.uuid,
            "estado_dispositivo": estado,
            "sesion_id": sesion_id
        })

    return dispositivos_con_estado




def cambiar_estado_dispositivo(db: Session, dispositivo_id: int, paciente_id: int, sesion_id: int):
    """
    Activa o desactiva un dispositivo en una sesión, asignándolo al paciente si es necesario.
    """
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.id_dispositivo == dispositivo_id).first()
    
    if not dispositivo:
        raise HTTPException(status_code=404, detail="El dispositivo no existe")

    # Buscar si el dispositivo ya está asociado con este paciente
    paciente_dispositivo = (
        db.query(PacienteDispositivo)
        .filter(
            PacienteDispositivo.id_paciente_pd_fk == paciente_id,
            PacienteDispositivo.id_dispositivo_pd_fk == dispositivo_id
        )
        .first()
    )

    # Si el dispositivo no está asociado al paciente, creamos la relación
    if not paciente_dispositivo:
        paciente_dispositivo = PacienteDispositivo(
            id_paciente_pd_fk=paciente_id,
            id_dispositivo_pd_fk=dispositivo_id
        )
        db.add(paciente_dispositivo)
        db.commit()
        db.refresh(paciente_dispositivo)

    # Verificar si el dispositivo ya tiene una sesión activa
    sesion_dispositivo = (
        db.query(SesionDispositivo)
        .filter(
            SesionDispositivo.id_sesion_fk == sesion_id,
            SesionDispositivo.id_dispositivo_pd_fk == paciente_dispositivo.id_paciente_dispositivo
        )
        .first()
    )

    if not sesion_dispositivo:
        sesion_dispositivo = SesionDispositivo(
            id_sesion_fk=sesion_id,
            id_dispositivo_pd_fk=paciente_dispositivo.id_paciente_dispositivo,
            estado_activado=EstadoDispositivoEnum.ACTIVADO
        )
        db.add(sesion_dispositivo)
        nuevo_estado = EstadoDispositivoEnum.ACTIVADO
    else:
        nuevo_estado = (
            EstadoDispositivoEnum.ACTIVADO 
            if sesion_dispositivo.estado_activado == EstadoDispositivoEnum.DESACTIVADO 
            else EstadoDispositivoEnum.DESACTIVADO
        )
        sesion_dispositivo.estado_activado = nuevo_estado

    db.commit()
    db.refresh(sesion_dispositivo)
    
    return {"id_dispositivo": dispositivo_id, "estado": nuevo_estado.value}


