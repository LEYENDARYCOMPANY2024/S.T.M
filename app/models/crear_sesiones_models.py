from sqlalchemy import Column, Integer, Text, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Sesion(Base):
    __tablename__ = 'sesiones'
    id_sesion = Column(Integer, primary_key=True)
    descripcion_sesion = Column(Text, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)

    pacientes = relationship("PacienteSesion", back_populates="sesion")


class PacienteSesion(Base):
    __tablename__ = 'paciente_sesiones_p'
    id_paciente_sesion = Column(Integer, primary_key=True)
    id_paciente_ps_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
    id_sesion_ps_fk = Column(Integer, ForeignKey("sesiones.id_sesion"), nullable=False)

    paciente = relationship("Paciente", back_populates="sesiones")
    sesion = relationship("Sesion", back_populates="pacientes")
