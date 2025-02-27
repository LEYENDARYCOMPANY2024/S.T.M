from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.paciente_terapeuta_principal_controller import create_paciente

router = APIRouter()

@router.post("/pacientes")
def agregar_paciente(paciente_data: dict, id_terapeuta: int, db: Session = Depends(get_db)):
    nuevo_paciente = create_paciente(db, paciente_data, id_terapeuta)
    return nuevo_paciente  # Devuelve el paciente con su código
