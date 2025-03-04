from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import enum

# 🔹 Definir correctamente el ENUM en Python
class OcupacionEnum(str, enum.Enum):
    empleado = "empleado/a"
    freelance = "freelance"
    autonomo = "autónomo"
    empleador = "empleador/a"
    desempleado = "desempleado/a"
    estudiante = "estudiante"
    jubilado = "jubilado/a"
    pensionado = "pensionado/a"
    otro = "otro"

class Paciente(Base):
    __tablename__ = "pacientes"

    id_paciente = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    primer_apellido = Column(String(100), nullable=False)
    segundo_apellido = Column(String(100), nullable=True)
    edad = Column(Integer, nullable=False)
    codigo = Column(String(50), nullable=False, unique=True)
    genero = Column(String, nullable=False)
    estado_civil = Column(String, nullable=True)
    escolaridad = Column(String, nullable=True)
    ocupacion = Column(Enum(OcupacionEnum, name="ocupacion_enum"), nullable=True)
    nombre_usuario_p = Column(String(100), unique=True, nullable=True)
    contrasena_p = Column(String, nullable=True)
    estado_paciente = Column(String, nullable=False)

    # 🔹 Relación con `Terapeuta` a través de `TerapeutaPaciente`
    terapeutas = relationship("Terapeuta", secondary="terapeuta_paciente", back_populates="pacientes")  # ✅ Agregado
