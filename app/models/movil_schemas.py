from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class GraficasTablasMovilIn(BaseModel):
    id_sesion_fk: Optional[int]
    datos_graficas: Optional[Dict[str, List[Any]]]  # ejemplo: { izquierda: [...], derecha: [...] }
    datos_mediapipe: Optional[List[dict]]  # ← ✅ Acepta array de objetos

class GraficasTablasMovilOut(GraficasTablasMovilIn):
    id_tabla_movil: int
    fecha_registro: datetime

    class Config:
        orm_mode = True
