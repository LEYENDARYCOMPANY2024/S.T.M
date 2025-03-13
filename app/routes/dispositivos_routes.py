from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.dispositivos_controller import obtener_dispositivos, cambiar_estado_dispositivo
from models.dispositivos_schemas import DispositivoResponse

router = APIRouter()

@router.get("/dispositivos/{paciente_id}", response_model=list[DispositivoResponse])
def listar_dispositivos(paciente_id: int, db: Session = Depends(get_db)):
    return obtener_dispositivos(db, paciente_id)


@router.put("/dispositivos/{paciente_id}/{dispositivo_id}/toggle")
def toggle_estado_dispositivo(paciente_id: int, dispositivo_id: int, db: Session = Depends(get_db)):
    return cambiar_estado_dispositivo(db, dispositivo_id, paciente_id)
