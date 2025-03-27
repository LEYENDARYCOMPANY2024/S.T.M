from sqlalchemy import Column, Integer, Text, Date, Time, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from database import Base

# 📌 Definir el esquema de datos esperado en la solicitud
class NotaEvolutivaUpdate(BaseModel):
    nota_evolutiva: str  # 📌 Debe coincidir con el JSON enviado desde el frontend

class DescripcionUpdate(BaseModel):
    descripcion_sesion: str

class Sesion(Base):
    __tablename__ = 'sesiones'
    id_sesion = Column(Integer, primary_key=True)
    descripcion_sesion = Column(Text, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    nota_evolutiva = Column(Text, nullable=True) 
    video_mediapipe_t = Column(JSON, nullable=False, default={})  # ✅ JSON vacío por defecto
    
    tabla_movil = relationship("GraficasTablasMovil", back_populates="sesion", uselist=False)
    pacientes = relationship("PacienteSesion", back_populates="sesion")


class PacienteSesion(Base):
    __tablename__ = 'paciente_sesiones_p'
    id_paciente_sesion = Column(Integer, primary_key=True)
    id_paciente_ps_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
    id_sesion_ps_fk = Column(Integer, ForeignKey("sesiones.id_sesion"), nullable=False)
    id_terapeuta_fk = Column(Integer, ForeignKey("terapeutas.id_terapeuta"), nullable=False)

    paciente = relationship("Paciente", back_populates="sesiones")
    sesion = relationship("Sesion", back_populates="pacientes")
    terapeuta = relationship("Terapeuta")
