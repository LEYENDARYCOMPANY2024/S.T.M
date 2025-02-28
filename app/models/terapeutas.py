from pydantic import BaseModel, constr, EmailStr  # ✅ Solo importar lo necesario desde Pydantic
from typing import Optional
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base  # ✅ Base debe venir de SQLAlchemy, no de Pydantic


# 📌 Modelo Pydantic para validar datos del terapeuta
class TerapeutaBase(BaseModel):
    nombre_usuario: constr(strip_whitespace=True, min_length=3, max_length=100)
    nombre: constr(strip_whitespace=True, min_length=1, max_length=100)
    primer_apellido: constr(strip_whitespace=True, min_length=1, max_length=100)
    segundo_apellido: Optional[constr(strip_whitespace=True, max_length=100)] = None
    correo: EmailStr
    contrasena: Optional[constr(min_length=6)] = None  # ✅ Ahora no es obligatoria
    codigo_postal: Optional[constr(strip_whitespace=True, max_length=10)] = None
    calle: Optional[constr(strip_whitespace=True, max_length=255)] = None
    colonia: Optional[constr(strip_whitespace=True, max_length=255)] = None
    num_ext: Optional[constr(strip_whitespace=True, max_length=10)] = None
    num_int: Optional[constr(strip_whitespace=True, max_length=10)] = None

# 📌 Modelo de Base de Datos (SQLAlchemy)
class Terapeuta(Base):  
    __tablename__ = "terapeutas"

    id_terapeuta = Column(Integer, primary_key=True, index=True)
    nombre_usuario = Column(String, unique=True, nullable=False)
    nombre = Column(String, nullable=False)
    primer_apellido = Column(String, nullable=False)
    segundo_apellido = Column(String, nullable=True)
    correo = Column(String, unique=True, nullable=False)
    contrasena = Column(String, nullable=False)

    # 🔹 Relación con `Paciente` a través de `TerapeutaPaciente`
    pacientes = relationship("Paciente", secondary="terapeuta_paciente", back_populates="terapeutas")  # ✅ Agregado

# 📌 Modelo para respuesta (sin contraseña)
class TerapeutaResponse(TerapeutaBase):
    id_terapeuta: int

    class Config:
        from_attributes = True  # ✅ Nueva sintaxis en Pydantic v2
        
class TerapeutaPaciente(Base):
    __tablename__ = "terapeuta_paciente"
    id_terapeuta_paciente = Column(Integer, primary_key=True, autoincrement=True)
    id_terapeuta_tp_fk = Column(Integer, ForeignKey("terapeutas.id_terapeuta"), nullable=False)
    id_paciente_tp_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
