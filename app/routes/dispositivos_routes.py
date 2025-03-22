from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.dispositivos_controller import obtener_dispositivos, cambiar_estado_dispositivo, registrar_dispositivo_por_correo, verificar_estado_dispositivo, asignar_lado_dispositivo, desactivar_dispositivos_por_sesion
from models.dispositivos_schemas import DispositivoResponse
from models.graficas_models import GraficaDispositivo
from models.dispositivos_models import SesionDispositivo, PacienteDispositivo, DispositivoIOT
from models.dispositivos_schemas import LadoRequest

router = APIRouter()

@router.get("/dispositivos/estado/{uuid}")
def obtener_estado_dispositivo(uuid: str, db: Session = Depends(get_db)):
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
    return obtener_dispositivos(db, paciente_id, terapeuta_id)



@router.put("/dispositivos/{paciente_id}/{sesion_id}/{dispositivo_id}/toggle")
def toggle_estado_dispositivo(paciente_id: int, sesion_id: int, dispositivo_id: int, db: Session = Depends(get_db)):
    return cambiar_estado_dispositivo(db, dispositivo_id, paciente_id, sesion_id)


@router.post("/dispositivos/registrar")
def registrar_dispositivo(correo: str = Body(...), nombre: str = Body(...), tipo: str = Body(...), db: Session = Depends(get_db)):
    return registrar_dispositivo_por_correo(db, correo, nombre, tipo)



# routes/dispositivos_routes.py

@router.put("/dispositivos/lado_pierna/{sesion_dispositivo_id}")
def asignar_lado_pierna(sesion_dispositivo_id: int, body: LadoRequest, db: Session = Depends(get_db)):
    return asignar_lado_dispositivo(db, sesion_dispositivo_id, body.lado)

@router.get("/dispositivos/activos")
def obtener_dispositivos_activados(db: Session = Depends(get_db)):
    dispositivos_activados = (
        db.query(SesionDispositivo, PacienteDispositivo, DispositivoIOT)
        .join(PacienteDispositivo, SesionDispositivo.id_dispositivo_pd_fk == PacienteDispositivo.id_paciente_dispositivo)
        .join(DispositivoIOT, PacienteDispositivo.id_dispositivo_pd_fk == DispositivoIOT.id_dispositivo)
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
                "id": sesion_dispositivo.id_sesion_dispositivo,
                "nombre": dispositivo.nombre_dispositivo,
                "pierna": grafica.lado_pierna if grafica else ""
            })
        except Exception as e:
            print(f"⚠️ Error al procesar dispositivo activo: {e}")
            continue

    return resultado


@router.put("/sesiones/{sesion_id}/cerrar")
def cerrar_sesion(sesion_id: int, db: Session = Depends(get_db)):
    return desactivar_dispositivos_por_sesion(db, sesion_id)


@router.put("/dispositivos/desactivar/{id_sesion}")
def desactivar_dispositivos_por_sesion(id_sesion: int, db: Session = Depends(get_db)):
    dispositivos = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_sesion_fk == id_sesion,
        SesionDispositivo.estado_activado == "activado"
    ).all()

    for dispositivo in dispositivos:
        dispositivo.estado_activado = "desactivado"

    db.commit()
    return {"mensaje": f"{len(dispositivos)} dispositivos desactivados"}

@router.get("/dispositivos/sesion_dispositivo/{uuid}")
def obtener_sesion_dispositivo_activo(uuid: str, db: Session = Depends(get_db)):
    dispositivo = db.query(DispositivoIOT).filter(DispositivoIOT.uuid == uuid).first()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    pd = db.query(PacienteDispositivo).filter(
        PacienteDispositivo.id_dispositivo_pd_fk == dispositivo.id_dispositivo
    ).first()

    if not pd:
        raise HTTPException(status_code=404, detail="Relación paciente-dispositivo no encontrada")

    sd = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_dispositivo_pd_fk == pd.id_paciente_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    if not sd:
        raise HTTPException(status_code=404, detail="No hay sesión activa para este dispositivo")

    # Obtener lado de pierna si existe
    graf = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == sd.id_sesion_dispositivo
    ).first()

    return {
        "id_sesion_dispositivo": sd.id_sesion_dispositivo,
        "lado_pierna": graf.lado_pierna if graf else None
    }

