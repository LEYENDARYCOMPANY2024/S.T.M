from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base
from .enum_paciente import EstadoNivelEnum

class Nivel(Base):
    __tablename__ = "niveles"

    id_nivel = Column(Integer, primary_key=True, index=True)
    nombre_nivel = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, nullable=False)
    ejercicios = relationship("NivelEjercicio", back_populates="nivel")

class Ejercicio(Base):
    __tablename__ = "ejercicios"

    id_ejercicio = Column(Integer, primary_key=True, index=True)
    nom_ejercicio = Column(String(255), nullable=False)
    instrucciones = Column(Text, nullable=False)
    video_url = Column(Text, nullable=False)
    niveles = relationship("NivelEjercicio", back_populates="ejercicio")

class NivelEjercicio(Base):
    __tablename__ = "niveles_ejercicios"

    id_nivel_ejercicio = Column(Integer, primary_key=True, index=True)
    id_nivel_fk = Column(Integer, ForeignKey("niveles.id_nivel"), nullable=False)
    id_ejercicio_fk = Column(Integer, ForeignKey("ejercicios.id_ejercicio"), nullable=False)

    nivel = relationship("Nivel", back_populates="ejercicios")
    ejercicio = relationship("Ejercicio", back_populates="niveles")

class PacienteNivel(Base):
    __tablename__ = "paciente_nivel"

    id_paciente_nivel = Column(Integer, primary_key=True, index=True)
    id_paciente_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
    id_nivel_fk = Column(Integer, ForeignKey("niveles.id_nivel"), nullable=False)
    estado = Column(Enum(EstadoNivelEnum), default=EstadoNivelEnum.bloqueado)
    fecha_activacion = Column(TIMESTAMP, nullable=True)
