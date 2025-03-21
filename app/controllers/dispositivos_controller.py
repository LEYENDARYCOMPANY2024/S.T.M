from sqlalchemy.orm import Session
from models.dispositivos_models import DispositivoIOT, PacienteDispositivo, SesionDispositivo, EstadoDispositivoEnum
from fastapi import HTTPException
from models.terapeutas import Terapeuta
from datetime import date
from models.graficas_models import GraficaDispositivo, Grafica
import uuid as uuid_lib

def obtener_dispositivos(db: Session, paciente_id: int, terapeuta_id: int):
    dispositivos = (
        db.query(DispositivoIOT)
        .filter(DispositivoIOT.id_terapeuta_fk == terapeuta_id)
        .all()
    )

    dispositivos_con_estado = []
    for dispositivo in dispositivos:
        sesion_dispositivo = (
            db.query(SesionDispositivo)
            .join(PacienteDispositivo, SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo)
            .filter(PacienteDispositivo.id_paciente_pd_fk == paciente_id,
                    SesionDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo)
            .first()
        )

        estado = "desactivado"
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
    
    return {
    "id_dispositivo": dispositivo_id,
    "estado": nuevo_estado.value,
    "sesion_dispositivo_id": sesion_dispositivo.id_sesion_dispositivo
}




def registrar_dispositivo_por_correo(db: Session, correo: str, nombre_dispositivo: str, tipo: str):
    terapeuta = db.query(Terapeuta).filter(Terapeuta.correo == correo).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")

    # Verificar si ya existe ese UUID (por seguridad)
    nuevo_uuid = str(uuid_lib.uuid4())
    while db.query(DispositivoIOT).filter(DispositivoIOT.uuid == nuevo_uuid).first():
        nuevo_uuid = str(uuid_lib.uuid4())

    nuevo = DispositivoIOT(
        nombre_dispositivo=nombre_dispositivo,
        tipo_de_dispositivo=tipo,
        fecha_registro=date.today(),
        uuid=nuevo_uuid,
        id_terapeuta_fk=terapeuta.id_terapeuta
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "mensaje": "Dispositivo registrado exitosamente",
        "uuid": nuevo.uuid,
        "estado": "desactivado"
    }

def verificar_estado_dispositivo(db: Session, uuid: str):
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no registrado")

    return {
        "estado": "activo" if dispositivo.sesion_dispositivo and dispositivo.sesion_dispositivo.estado_activado == "activado" else "desactivado"
    }
    

# controllers/dispositivos_controller.py
def asignar_lado_dispositivo(db: Session, sesion_dispositivo_id: int, lado: str):
    if lado not in ["izquierda", "derecha"]:
        raise HTTPException(status_code=400, detail="Lado inválido")

    registro = (
        db.query(SesionDispositivo)
        .filter(SesionDispositivo.id_sesion_dispositivo == sesion_dispositivo_id)
        .first()
    )

    if not registro:
        raise HTTPException(status_code=404, detail="Sesión del dispositivo no encontrada")

    # Buscar o crear la entrada en graficas_dispositivos
    grafica_asociada = (
        db.query(GraficaDispositivo)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == sesion_dispositivo_id)
        .first()
    )

    if grafica_asociada:
        grafica_asociada.lado_pierna = lado
    else:
        nueva_grafica = Grafica(
            nombre_grafica="grafica_" + str(sesion_dispositivo_id)
        )
        db.add(nueva_grafica)
        db.commit()
        db.refresh(nueva_grafica)

        grafica_asociada = GraficaDispositivo(
            id_grafica_fk=nueva_grafica.id_grafica,
            id_sesion_dispositivo_fk=sesion_dispositivo_id,
            lado_pierna=lado
        )
        db.add(grafica_asociada)

    db.commit()
    return {"mensaje": "Lado asignado correctamente"}
