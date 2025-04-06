# models/historial_progreso.py
from sqlalchemy import Column, Integer, Date, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class HistorialProgreso(Base):
    __tablename__ = "historial_progreso"

    id_historial = Column(Integer, primary_key=True, index=True)
    id_terapeuta_paciente_fk = Column(Integer, ForeignKey("terapeuta_paciente.id_terapeuta_paciente"), nullable=False)
    fecha_inicio = Column(Date, default=date.today(), nullable=False)
    fecha_fin = Column(Date, nullable=True)
    resumen = Column(String, nullable=False)

    # Relación con TerapeutaPaciente (asumiendo que ya existe la clase TerapeutaPaciente)
    terapeuta_paciente = relationship("TerapeutaPaciente", back_populates="historial_progreso")
