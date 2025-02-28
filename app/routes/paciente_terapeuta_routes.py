from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.paciente_terapeuta_principal_controller import create_paciente
from models.paciente_terapeuta_principal import Paciente
from models.terapeutas import Terapeuta, TerapeutaPaciente  # 🔹 Asegúrate de importar `TerapeutaPaciente`


router = APIRouter()

@router.get("/pacientes")
def obtener_pacientes(id_terapeuta: int, db: Session = Depends(get_db)):
    pacientes = (
        db.query(Paciente)
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)  # 🔹 Hacemos JOIN con la tabla de relación
        .filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta)  # 🔹 Filtramos por el terapeuta
        .all()
    )

    if not pacientes:
        raise HTTPException(status_code=404, detail="No hay pacientes registrados para este terapeuta.")

    return pacientes


@router.post("/pacientes")
def agregar_paciente(paciente_data: dict, id_terapeuta: int, db: Session = Depends(get_db)):
    nuevo_paciente = create_paciente(db, paciente_data, id_terapeuta)
    return nuevo_paciente  # Devuelve el paciente con su código
