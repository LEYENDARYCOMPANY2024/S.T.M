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
        # IMPORTANTE: Ajustamos la comparación
        sesion_dispositivo = (
            db.query(SesionDispositivo)
            .join(
                PacienteDispositivo,
                SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo
            )
            .filter(
                PacienteDispositivo.id_paciente_pd_fk == paciente_id,
                PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
            )
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
    Activa o desactiva (toggle) el dispositivo 'dispositivo_id' para el paciente 'paciente_id'
    en la sesión 'sesion_id'. Solo permite un máximo de 2 dispositivos activados por sesión.
    """
    # 1) Verificar que exista el dispositivo
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.id_dispositivo == dispositivo_id).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="El dispositivo no existe")
    
    # Verificar si ya está asociado a otro paciente
    otro_paciente = (
        db.query(PacienteDispositivo)
        .filter(
            PacienteDispositivo.id_dispositivo_pd_fk == dispositivo_id,
            PacienteDispositivo.id_paciente_pd_fk != paciente_id
        )
        .first()
    )
    if otro_paciente:
        raise HTTPException(status_code=400, detail="Este dispositivo ya está asignado a otro paciente.")

    # 2) Verificar o crear la relación PacienteDispositivo
    paciente_dispositivo = (
        db.query(PacienteDispositivo)
        .filter(
            PacienteDispositivo.id_paciente_pd_fk == paciente_id,
            PacienteDispositivo.id_dispositivo_pd_fk == dispositivo_id
        )
        .first()
    )
    if not paciente_dispositivo:
        paciente_dispositivo = PacienteDispositivo(
            id_paciente_pd_fk=paciente_id,
            id_dispositivo_pd_fk=dispositivo_id
        )
        db.add(paciente_dispositivo)
        db.commit()
        db.refresh(paciente_dispositivo)

    # 3) Verificar si ya existe la relación SesionDispositivo para ESTA sesión
    sesion_dispositivo = (
        db.query(SesionDispositivo)
        .join(
            PacienteDispositivo,
            SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo
        )
        .filter(
            PacienteDispositivo.id_paciente_pd_fk == paciente_id,
            PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo,
            SesionDispositivo.id_sesion_fk == sesion_id  # Importante para que sea por sesión
        )
        .first()
    )

    # 4) Contar cuántos dispositivos están activados en esta sesión
    def dispositivos_activados_en_sesion():
        return db.query(SesionDispositivo).filter(
            SesionDispositivo.id_sesion_fk == sesion_id,
            SesionDispositivo.estado_activado == "activado"
        ).count()

    if not sesion_dispositivo:
        # Si no existe aún la relación, significa que el usuario hace toggle por primera vez en esta sesión.
        # Asumimos que si el usuario hace "toggle", quiere ACTIVAR el dispositivo.
        activos = dispositivos_activados_en_sesion()
        if activos >= 2:
            raise HTTPException(
                status_code=400,
                detail="Solo se permiten 2 dispositivos activados a la vez en esta sesión."
            )
            
        # Creamos el nuevo registro activado
        sesion_dispositivo = SesionDispositivo(
            id_sesion_fk=sesion_id,
            id_dispositivo_pd_fk=paciente_dispositivo.id_paciente_dispositivo,
            estado_activado="activado"
        )
        db.add(sesion_dispositivo)
        nuevo_estado = "activado"

    else:
        # Ya existe la relación para esta sesión, así que hacemos toggle
        if sesion_dispositivo.estado_activado == "desactivado":
            # Si está desactivado y se va a activar, primero verificamos que no haya 2 ya activos
            activos = dispositivos_activados_en_sesion()
            if activos >= 2:
                raise HTTPException(
                    status_code=400,
                    detail="Solo se permiten 2 dispositivos activados a la vez en esta sesión."
                )
            sesion_dispositivo.estado_activado = "activado"
            nuevo_estado = "activado"
        else:
            # Si está activado, lo desactivamos
            sesion_dispositivo.estado_activado = "desactivado"
            nuevo_estado = "desactivado"
            

    # 5) Guardar los cambios
    db.commit()
    db.refresh(sesion_dispositivo)

    return {
        "id_dispositivo": dispositivo_id,
        "estado": nuevo_estado,
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

def desactivar_dispositivos_por_sesion(db: Session, sesion_id: int):
    dispositivos = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_sesion_fk == sesion_id,
        SesionDispositivo.estado_activado == "activado"
    ).all()

    for d in dispositivos:
        d.estado_activado = "desactivado"

    db.commit()
    return {"mensaje": f"{len(dispositivos)} dispositivos desactivados"}
