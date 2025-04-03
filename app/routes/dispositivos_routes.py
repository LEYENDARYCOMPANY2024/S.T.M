from fastapi import APIRouter, Depends, Body, HTTPException, Query
from sqlalchemy.orm import Session

# Ajusta la importación a tu archivo de conexión de BD
from database import get_db  

# Controladores (controllers) que usas para la lógica
from controllers.dispositivos_controller import (
    obtener_dispositivos,
    cambiar_estado_dispositivo,
    registrar_dispositivo_por_correo,
    asignar_lado_dispositivo,
    desactivar_dispositivos_por_sesion
)

# Schemas y modelos
from models.dispositivos_schemas import DispositivoResponse, LadoRequest, PermisoEnvio
from models.graficas_models import GraficaDispositivo
from models.dispositivos_models import SesionDispositivo, PacienteDispositivo, DispositivoIOT

router = APIRouter()

@router.get("/dispositivos/permiso_envio/{uuid}")
def permiso_envio(uuid: str, db: Session = Depends(get_db)):
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    return {"permite": dispositivo.permite_envio}

# routes/dispositivos_routes.py
@router.put("/dispositivos/permiso_envio/{uuid}")
def actualizar_permiso_envio(uuid: str, permiso: PermisoEnvio, db: Session = Depends(get_db)):
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    dispositivo.permite_envio = permiso.estado
    db.commit()
    return {"mensaje": f"Permiso actualizado a {permiso.estado}"}

@router.get("/dispositivos/estado/{uuid}")
def obtener_estado_dispositivo_route(uuid: str, db: Session = Depends(get_db)):
    """
    Retorna el estado (activo/desactivado) de un dispositivo basado en su UUID.
    """
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no registrado")

    paciente_dispositivo = db.query(PacienteDispositivo).filter(
        PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
    ).first()

    if not paciente_dispositivo:
        return {"estado": "desactivado"}

    sesion_activa = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_dispositivo_pd_fk == paciente_dispositivo.id_paciente_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    return {"estado": "activo" if sesion_activa else "desactivado"}


@router.get("/dispositivos/{paciente_id}/{terapeuta_id}", response_model=list[DispositivoResponse])
def listar_dispositivos(paciente_id: int, terapeuta_id: int, db: Session = Depends(get_db)):
    """
    Lista los dispositivos registrados por un terapeuta y muestra si están vinculados a un paciente dado.
    """
    return obtener_dispositivos(db, paciente_id, terapeuta_id)


@router.put("/dispositivos/{paciente_id}/{sesion_id}/{dispositivo_id}/toggle")
def toggle_estado_dispositivo(paciente_id: int, sesion_id: int, dispositivo_id: int, db: Session = Depends(get_db)):
    """
    Activa o desactiva (toggle) un dispositivo para un paciente específico en una sesión dada.
    Permite máximo 2 dispositivos activados por sesión.
    """
    return cambiar_estado_dispositivo(db, dispositivo_id, paciente_id, sesion_id)


@router.post("/dispositivos/registrar")
def registrar_dispositivo(
    correo: str = Body(...),
    nombre: str = Body(...),
    tipo: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo dispositivo, generando un UUID y asociándolo al terapeuta dado (por su correo).
    """
    return registrar_dispositivo_por_correo(db, correo, nombre, tipo)


@router.put("/dispositivos/lado_pierna/{sesion_dispositivo_id}")
def asignar_lado_pierna(sesion_dispositivo_id: int, body: LadoRequest, db: Session = Depends(get_db)):
    """
    Asigna el lado de la pierna (izquierda/derecha) a un registro en 'graficas_dispositivos',
    creando la gráfica si no existe.
    """
    return asignar_lado_dispositivo(db, sesion_dispositivo_id, body.lado)


@router.get("/dispositivos/activos")
def obtener_dispositivos_activados(db: Session = Depends(get_db)):
    """
    Retorna la lista de dispositivos que actualmente están ACTIVADOS
    (sesion_dispositivo.estado_activado = 'activado'),
    junto a su uuid y lado si está definido.
    """
    dispositivos_activados = (
        db.query(SesionDispositivo, PacienteDispositivo, DispositivoIOT)
        .join(
            PacienteDispositivo,
            SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo
        )
        .join(
            DispositivoIOT,
            PacienteDispositivo.id_dispositivo_pd_fk == DispositivoIOT.id_dispositivo
        )
        .filter(SesionDispositivo.estado_activado == "activado")
        .all()
    )

    resultado = []
    for sesion_dispositivo, paciente_dispositivo, dispositivo in dispositivos_activados:
        try:
            grafica = db.query(GraficaDispositivo).filter(
                GraficaDispositivo.id_sesion_dispositivo_fk == sesion_dispositivo.id_sesion_dispositivo
            ).first()

            resultado.append({
                "id": sesion_dispositivo.id_sesion_dispositivo,   # ID de la relación
                "nombre": dispositivo.nombre_dispositivo,
                "uuid": dispositivo.uuid,
                "pierna": grafica.lado_pierna if grafica else ""
            })
        except Exception as e:
            print(f"⚠️ Error al procesar dispositivo activo: {e}")
            continue

    return resultado


@router.put("/sesiones/{sesion_id}/cerrar")
def cerrar_sesion(sesion_id: int, db: Session = Depends(get_db)):
    """
    Desactiva todos los dispositivos que estén activados en la sesión dada.
    """
    return desactivar_dispositivos_por_sesion(db, sesion_id)


@router.put("/dispositivos/desactivar/{id_sesion}")
def desactivar_dispositivos_por_sesion_route(id_sesion: int, db: Session = Depends(get_db)):
    """
    Desactiva todos los dispositivos activados en la sesión dada (versión directa).
    """
    dispositivos = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_sesion_fk == id_sesion,
        SesionDispositivo.estado_activado == "activado"
    ).all()
    for dispositivo in dispositivos:
        dispositivo.estado_activado = "desactivado"
    db.commit()
    return {"mensaje": f"{len(dispositivos)} dispositivos desactivados"}


@router.get("/dispositivos/sesion_dispositivo/{uuid}")
def obtener_sesion_dispositivo_activo(uuid: str, paciente_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Dado el UUID de un dispositivo y un paciente_id, retorna la sesión activa
    y el lado de la pierna si existe.
    """
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    pd = db.query(PacienteDispositivo).filter(
        PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo,
        PacienteDispositivo.id_paciente_pd_fk == paciente_id
    ).first()

    if not pd:
        raise HTTPException(status_code=404, detail="Relación paciente-dispositivo no encontrada")

    sd = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_dispositivo_pd_fk == pd.id_paciente_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    if not sd:
        raise HTTPException(status_code=404, detail="No hay sesión activa para este dispositivo")

    graf = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == sd.id_sesion_dispositivo
    ).first()

    return {
        "id_sesion_dispositivo": sd.id_sesion_dispositivo,
        "lado_pierna": graf.lado_pierna if graf else None
    }


@router.get("/dispositivos/paciente_activo/{uuid}")
def obtener_paciente_activo(uuid: str, db: Session = Depends(get_db)):
    """
    Dado el UUID de un dispositivo, retorna el paciente y sesión activa asociada.
    """
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    pd = db.query(PacienteDispositivo).filter(
        PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
    ).first()

    if not pd:
        raise HTTPException(status_code=404, detail="No hay sesión/paciente para este dispositivo")

    sd = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_dispositivo_pd_fk == pd.id_paciente_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    if not sd:
        raise HTTPException(status_code=404, detail="No hay sesión activa para este dispositivo")

    # Asumiendo que en tu modelo PacienteDispositivo tienes un relationship con Paciente
    paciente = pd.paciente  
    graf = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == sd.id_sesion_dispositivo
    ).first()

    return {
        "id_paciente": paciente.id_paciente,
        "codigo_paciente": paciente.codigo,
        "id_sesion_dispositivo": sd.id_sesion_dispositivo,
        "lado_pierna": graf.lado_pierna if graf else None
    }



@router.post("/esp/configurar_paciente")
def configurar_paciente_route(payload: dict = Body(...), db: Session = Depends(get_db)):
    uuid = payload.get("uuid")
    id_paciente = payload.get("id_paciente")
    id_sesion_dispositivo = payload.get("id_sesion_dispositivo")
    lado_pierna = payload.get("lado_pierna")

    if not uuid or not isinstance(id_paciente, int) or not isinstance(id_sesion_dispositivo, int):
        raise HTTPException(status_code=400, detail="Faltan datos o tipos de datos inválidos")

    # Guardar configuración
    from models.dispositivos_models import ConfiguracionDispositivo

    existente = db.query(ConfiguracionDispositivo).filter(ConfiguracionDispositivo.uuid == uuid).first()
    if existente:
        existente.id_paciente = id_paciente
        existente.id_sesion_dispositivo = id_sesion_dispositivo
        existente.lado_pierna = lado_pierna
    else:
        nueva = ConfiguracionDispositivo(
            uuid=uuid,
            id_paciente=id_paciente,
            id_sesion_dispositivo=id_sesion_dispositivo,
            lado_pierna=lado_pierna
        )
        db.add(nueva)

    db.commit()

    return {
        "mensaje": "Configuración enviada correctamente",
        "uuid": uuid,
        "id_paciente": id_paciente,
        "id_sesion_dispositivo": id_sesion_dispositivo,
        "lado_pierna": lado_pierna
    }


@router.get("/esp/id_paciente_por_uuid/{uuid}")
def obtener_info_por_uuid(uuid: str, db: Session = Depends(get_db)):
    """
    Dado un UUID, retorna el paciente, sesión activa y lado_pierna asociados.
    Este endpoint lo usa el ESP32 para configurarse automáticamente.
    """
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    # Buscar relación con paciente
    pd = db.query(PacienteDispositivo).filter(
        PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
    ).first()

    if not pd:
        raise HTTPException(status_code=404, detail="Relación paciente-dispositivo no encontrada")

    # Buscar sesión activa
    sd = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_dispositivo_pd_fk == pd.id_paciente_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    if not sd:
        raise HTTPException(status_code=404, detail="No hay sesión activa para este dispositivo")

    # Buscar lado pierna si existe
    graf = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == sd.id_sesion_dispositivo
    ).first()

    paciente = pd.paciente

    return {
        "id_paciente": paciente.id_paciente,
        "codigo_paciente": paciente.codigo,
        "id_sesion_dispositivo": sd.id_sesion_dispositivo,
        "lado_pierna": graf.lado_pierna if graf else None
    }




@router.get("/dispositivos/configuracion_actual/{uuid}")
def obtener_configuracion_dispositivo(uuid: str, db: Session = Depends(get_db)):
    from models.dispositivos_models import ConfiguracionDispositivo

    config = db.query(ConfiguracionDispositivo).filter(ConfiguracionDispositivo.uuid == uuid).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada para este UUID")

    return {
        "id_paciente": config.id_paciente,
        "id_sesion_dispositivo": config.id_sesion_dispositivo,
        "lado_pierna": config.lado_pierna
    }


