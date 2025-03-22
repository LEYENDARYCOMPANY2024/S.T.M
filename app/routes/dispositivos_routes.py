from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from controllers.dispositivos_controller import obtener_dispositivos, cambiar_estado_dispositivo, registrar_dispositivo_por_correo, verificar_estado_dispositivo, asignar_lado_dispositivo, desactivar_dispositivos_por_sesion
from models.dispositivos_schemas import DispositivoResponse
from models.graficas_models import GraficaDispositivo
from models.dispositivos_models import SesionDispositivo

router = APIRouter()

@router.get("/dispositivos/estado/{uuid}")
def obtener_estado_dispositivo(uuid: str, db: Session = Depends(get_db)):
    return verificar_estado_dispositivo(db, uuid)

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
def asignar_lado_pierna(sesion_dispositivo_id: int, lado: str = Body(...), db: Session = Depends(get_db)):
    return asignar_lado_dispositivo(db, sesion_dispositivo_id, lado)

@router.get("/dispositivos/activos")
def obtener_dispositivos_activados(db: Session = Depends(get_db)):
    dispositivos_activados = (
        db.query(SesionDispositivo)
        .filter(SesionDispositivo.estado_activado == "activado")
        .all()
    )

    resultado = []
    for sd in dispositivos_activados:
        try:
            paciente_dispositivo = sd.dispositivo
            dispositivo = paciente_dispositivo.dispositivo  # ✅ Corrección aquí

            grafica = db.query(GraficaDispositivo).filter(
                GraficaDispositivo.id_sesion_dispositivo_fk == sd.id_sesion_dispositivo
            ).first()

            resultado.append({
                "id": sd.id_sesion_dispositivo,
                "nombre": dispositivo.nombre_dispositivo,
                "pierna": grafica.lado_pierna if grafica else ""
            })
        except Exception as e:
            print(f"⚠️ Error al procesar dispositivo activo: {e}")
            continue  # Saltar si algo falla en un registro

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
    return {"mensaje": f"{len(dispositivos)} dispositivos desactivados."}
