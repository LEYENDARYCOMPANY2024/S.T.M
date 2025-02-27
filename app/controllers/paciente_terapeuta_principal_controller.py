import random
import string
from sqlalchemy.orm import Session
from models.patient import Paciente
from models.paciente_terapeuta_principal import TerapeutaPaciente

def generar_codigo_paciente():
    """Genera un código aleatorio único para el paciente."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def create_paciente(db: Session, paciente_data, id_terapeuta: int):
    paciente_data["estado_paciente"] = "activo"  # Se pone en estado activo por defecto
    paciente_data["codigo"] = generar_codigo_paciente()  # Genera el código automáticamente

    # Crear paciente
    nuevo_paciente = Paciente(**paciente_data)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)

    # Asociar paciente con el terapeuta
    nueva_relacion = TerapeutaPaciente(id_terapeuta_tp_fk=id_terapeuta, id_paciente_tp_fk=nuevo_paciente.id_paciente)
    db.add(nueva_relacion)
    db.commit()

    return nuevo_paciente  # Retorna el paciente con el código generado
