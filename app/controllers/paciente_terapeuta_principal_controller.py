from sqlalchemy.orm import Session
from models.paciente_terapeuta_principal import Paciente

def get_pacientes(db: Session):
    return db.query(Paciente).all()

def get_paciente_by_id(db: Session, paciente_id: int):
    return db.query(Paciente).filter(Paciente.id_paciente == paciente_id).first()

def create_paciente(db: Session, paciente_data):
    paciente_data["estado_paciente"] = "activo"  # Se agrega por defecto como activo
    nuevo_paciente = Paciente(**paciente_data)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)
    return nuevo_paciente
