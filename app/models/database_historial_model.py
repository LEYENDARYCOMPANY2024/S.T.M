from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base  
from pydantic import BaseModel

class HistorialClinico(Base):
    __tablename__ = "historial_clinico"

    id_historial_clinico = Column(Integer, primary_key=True, autoincrement=True)
    id_paciente_hc_fk = Column(Integer, ForeignKey("pacientes.id_paciente", ondelete="CASCADE"), nullable=False)
    datos_historial_clinico = Column(JSONB, nullable=False)

    # Relación con la tabla Pacientes (opcional, para facilitar consultas bidireccionales)
    paciente = relationship("Paciente", back_populates="historial_clinico")

# ✅ Modelo para actualizar los datos del paciente
class PacienteUpdate(BaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: str | None = None
    edad: int
    genero: str
    estado_civil: str | None = None
    escolaridad: str | None = None
    ocupacion: str | None = None