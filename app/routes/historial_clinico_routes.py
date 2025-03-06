from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.historial_clinico_model import HistorialClinicoCreate, HistorialClinicoResponse
from controllers.historial_clinico_controller import get_historial_by_patient, create_or_update_historial
from database import get_db

router = APIRouter(prefix="/historial", tags=["Historial Clínico"])

@router.get("/{id_paciente}", response_model=HistorialClinicoResponse)
def read_historial(id_paciente: int, db: Session = Depends(get_db)):
    """
    Obtiene el historial clínico del paciente por su ID.
    Si no existe, se crea automáticamente un historial vacío en la base de datos.
    """
    return get_historial_by_patient(db, id_paciente)

@router.post("/")
def post_historial(historial: HistorialClinicoCreate, db: Session = Depends(get_db)):
    """
    Crea o actualiza el historial clínico del paciente.
    Si el historial no existe, se creará uno nuevo automáticamente.
    """
    return create_or_update_historial(db, historial)

