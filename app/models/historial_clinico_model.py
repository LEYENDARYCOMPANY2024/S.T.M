from pydantic import BaseModel
from typing import Dict, Any

class HistorialClinicoBase(BaseModel):
    datos_historial_clinico: Dict[str, Any]

class HistorialClinicoCreate(HistorialClinicoBase):
    id_paciente_hc_fk: int

class HistorialClinicoResponse(HistorialClinicoBase):
    id_historial_clinico: int
    id_paciente_hc_fk: int

    class Config:
        from_attributes = True  # 🔹 Solución para Pydantic v2
