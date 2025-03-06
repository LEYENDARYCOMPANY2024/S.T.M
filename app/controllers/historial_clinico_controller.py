from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.historial_clinico_model import HistorialClinicoCreate
from models.database_historial_model import HistorialClinico  # Asegúrate de tener definido el modelo SQLAlchemy para historial_clinico

def get_historial_by_patient(db: Session, patient_id: int):
    historial = db.query(HistorialClinico).filter(HistorialClinico.id_paciente_hc_fk == patient_id).first()
    
    if not historial:
        # 🔹 Crear un historial vacío automáticamente en lugar de devolver error 404
        historial = HistorialClinico(
            id_paciente_hc_fk=patient_id,
            datos_historial_clinico={}  # Se crea vacío
        )
        db.add(historial)
        db.commit()
        db.refresh(historial)

    return historial

def create_or_update_historial(db: Session, historial_data: HistorialClinicoCreate):
    # Buscar si ya existe un historial para este paciente
    historial = db.query(HistorialClinico).filter(
        HistorialClinico.id_paciente_hc_fk == historial_data.id_paciente_hc_fk
    ).first()

    if historial:
        # Actualizar el historial existente
        historial.datos_historial_clinico = historial_data.datos_historial_clinico
    else:
        # Crear nuevo historial
        historial = HistorialClinico(**historial_data.dict())
        db.add(historial)

    db.commit()
    db.refresh(historial)
    return historial
