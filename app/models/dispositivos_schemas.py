from pydantic import BaseModel, EmailStr
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

class DispositivoRegistro(BaseModel):
    nombre_dispositivo: str
    tipo_de_dispositivo: str
    uuid: str
    correo_terapeuta: EmailStr  # 🔹 Usamos el correo del terapeuta en lugar del ID
    
class EstadoDispositivoEnum(Enum):
    ACTIVADO = "activado"
    DESACTIVADO = "desactivado"

class LadoPiernaEnum(Enum):
    IZQUIERDA = "izquierda"
    DERECHA = "derecha"
    
class LadoRequest(BaseModel):
    lado: str

class DatosSensor(BaseModel):
    uuid: str
    id_sesion_dispositivo: int
    lado_pierna: str
    nombre_grafica: str
    aceleracion_x: float
    aceleracion_y: float
    aceleracion_z: float
    rotacion_x: float
    rotacion_y: float
    rotacion_z: float