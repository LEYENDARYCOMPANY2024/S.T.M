from sqlalchemy.orm import Session
from models.patient import Paciente
from models.paciente_terapeuta_principal import TerapeutaPaciente

def create_paciente(db: Session, paciente_data, id_terapeuta: int):
    paciente_data["estado_paciente"] = "activo"  # Se agrega por defecto como activo

    # Crear paciente
    nuevo_paciente = Paciente(**paciente_data)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)

    # Asociar con el terapeuta
    nueva_relacion = TerapeutaPaciente(id_terapeuta_tp_fk=id_terapeuta, id_paciente_tp_fk=nuevo_paciente.id_paciente)
    db.add(nueva_relacion)
    db.commit()

    return {"message": "Paciente agregado y asignado correctamente."}
