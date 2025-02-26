from sqlalchemy import Column, Integer, String, Enum
from database import Base
from enum_paciente_terapeuta_principal import GeneroEnum, EstadoPacienteEnum

class Paciente(Base):
    __tablename__ = "pacientes"

    id_paciente = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    primer_apellido = Column(String(100), nullable=False)
    segundo_apellido = Column(String(100))
    edad = Column(Integer, nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    genero = Column(Enum(GeneroEnum), nullable=False)
    estado_paciente = Column(Enum(EstadoPacienteEnum), nullable=False, default="activo")

    def __init__(self, nombre, primer_apellido, segundo_apellido, edad, codigo, genero, estado_paciente="activo"):
        self.nombre = nombre
        self.primer_apellido = primer_apellido
        self.segundo_apellido = segundo_apellido
        self.edad = edad
        self.codigo = codigo
        self.genero = genero
        self.estado_paciente = estado_paciente
