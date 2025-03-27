from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GraficasTablasMovilIn(BaseModel):
    id_sesion_fk: Optional[int]
    datos_graficas: Optional[dict]
    datos_mediapipe: Optional[dict]

class GraficasTablasMovilOut(GraficasTablasMovilIn):
    id_tabla_movil: int
    fecha_registro: datetime

    class Config:
        orm_mode = True
