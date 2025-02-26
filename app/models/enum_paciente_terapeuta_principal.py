from enum import Enum

class GeneroEnum(str, Enum):
    masculino = "masculino"
    femenino = "femenino"

class EstadoPacienteEnum(str, Enum):
    activo = "activo"
    inactivo = "inactivo"
