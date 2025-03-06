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

    
class EscolaridadEnum(str, Enum):
    primaria = "primaria"
    secundaria = "secundaria"
    preparatoria = "preparatoria"
    licenciatura = "licenciatura"
    maestria = "maestria"
    doctorado = "doctorado"
    otro = "otro"

class OcupacionEnum(str, Enum):
    empleado = "empleado"
    freelance = "freelance"
    autonomo = "autonomo"
    empleador = "empleador"
    desempleado = "desempleado"
    estudiante = "estudiante"
    jubilado = "jubilado"
    pensionado = "pensionado"
    otro = "otro"