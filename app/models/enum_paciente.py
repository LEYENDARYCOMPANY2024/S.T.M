from enum import Enum

class GeneroEnum(str, Enum):
    masculino = "masculino"
    femenino = "femenino"

class EstadoPacienteEnum(str, Enum):
    activo = "activo"
    inactivo = "inactivo"


class EstadoCivilEnum(str, Enum):
    soltero = "soltero"
    casado = "casado"
    divorciado = "divorciado"
    viudo = "viudo"
    union_libre = "union_libre"
    separado = "separado"

    
    