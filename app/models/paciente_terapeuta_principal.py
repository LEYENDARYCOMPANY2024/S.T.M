from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from .enum_paciente import EstadoCivilEnum, EscolaridadEnum, OcupacionEnum

class Paciente(Base):
    __tablename__ = "pacientes"

    id_paciente = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    primer_apellido = Column(String(100), nullable=False)
    segundo_apellido = Column(String(100), nullable=True)
    edad = Column(Integer, nullable=False)
    codigo = Column(String(50), nullable=False, unique=True)
    genero = Column(String, nullable=False)
    estado_civil = Column(Enum(EstadoCivilEnum, nullable=True, name="estado_civil_enum"), nullable=True)
    escolaridad = Column(Enum(EscolaridadEnum, name="escolaridad_enum"), nullable=True)
    ocupacion = Column(Enum(OcupacionEnum, name="ocupacion_enum"), nullable=True)
    nombre_usuario_p = Column(String(100), unique=True, nullable=True)
    contrasena_p = Column(String, nullable=True)
    estado_paciente = Column(String, nullable=False)

    # 🔹 Relación con `Terapeuta` a través de `TerapeutaPaciente`
    terapeutas = relationship("Terapeuta", secondary="terapeuta_paciente", back_populates="pacientes")  # ✅ Agregado
    
    # 🔹 Relación inversa con HistorialClinico
    historial_clinico = relationship("HistorialClinico", back_populates="paciente", uselist=False)
