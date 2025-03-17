from pydantic import BaseModel
from datetime import date
from sqlalchemy import Enum

class DispositivoResponse(BaseModel):
    id_dispositivo: int
    nombre_dispositivo: str
    fecha_registro: date
    tipo_de_dispositivo: str
    uuid: str
    estado_dispositivo: str

    class Config:
        orm_mode = True

class EstadoDispositivoEnum(Enum):
    ACTIVADO = "activado"
    DESACTIVADO = "desactivado"

class LadoPiernaEnum(Enum):
    IZQUIERDA = "izquierda"
    DERECHA = "derecha"