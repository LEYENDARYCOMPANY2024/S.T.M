from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.controllers.paciente_terapeuta_principal_controller import get_pacientes, create_paciente

router = APIRouter()

@router.get("/pacientes")
def listar_pacientes(db: Session = Depends(get_db)):
    return get_pacientes(db)

@router.post("/pacientes")
def agregar_paciente(paciente_data: dict, db: Session = Depends(get_db)):
    return create_paciente(db, paciente_data)
