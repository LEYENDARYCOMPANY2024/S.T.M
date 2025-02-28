import random
import string
from sqlalchemy.orm import Session
from models.paciente_terapeuta_principal import Paciente
from models.terapeutas import TerapeutaPaciente

def generar_codigo_paciente():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def create_paciente(db: Session, paciente_data, id_terapeuta: int):
    print("📥 Datos recibidos en el backend:", paciente_data)  # <-- Agregado para depurar

    required_fields = ["nombre", "primer_apellido", "edad", "genero"]
    for field in required_fields:
        if not paciente_data.get(field):
            raise ValueError(f"Falta el campo obligatorio: {field}")

    paciente_data["estado_paciente"] = "activo"
    paciente_data["codigo"] = generar_codigo_paciente()

    nuevo_paciente = Paciente(**paciente_data)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)

    nueva_relacion = TerapeutaPaciente(id_terapeuta_tp_fk=id_terapeuta, id_paciente_tp_fk=nuevo_paciente.id_paciente)
    db.add(nueva_relacion)
    db.commit()

    return nuevo_paciente

