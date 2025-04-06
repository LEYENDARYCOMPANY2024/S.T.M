from pydantic import BaseModel, constr, EmailStr  # ✅ Solo importar lo necesario desde Pydantic
from typing import Optional
<<<<<<< HEAD
from sqlalchemy import Column, Integer, String, ForeignKey
=======
from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
>>>>>>> pruebas
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
<<<<<<< HEAD

    # 🔹 Relación con `Paciente` a través de `TerapeutaPaciente`
    pacientes = relationship("Paciente", secondary="terapeuta_paciente", back_populates="terapeutas")  # ✅ Agregado
=======
    codigo_postal = Column(String, nullable=True)
    calle = Column(String, nullable=True)
    colonia = Column(String, nullable=True)
    num_ext = Column(String, nullable=True)
    num_int = Column(String, nullable=True)
    foto_perfil = Column(LargeBinary, nullable=True)  # ✅ Imagen
    documento_cedula = Column(LargeBinary, nullable=True)   # ✅ PDF
    
    pacientes_pivote = relationship("TerapeutaPaciente", back_populates="terapeuta", overlaps="pacientes")
    dispositivos = relationship("DispositivoIOT", back_populates="terapeuta")

    # 🔹 Relación con `Paciente` a través de `TerapeutaPaciente`
    pacientes = relationship("Paciente", secondary="terapeuta_paciente", back_populates="terapeutas", overlaps="pacientes_pivote,terapeuta")
>>>>>>> pruebas

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
    
<<<<<<< HEAD
    historial_progreso = relationship("HistorialProgreso", back_populates="terapeuta_paciente")
=======
    paciente = relationship("Paciente", back_populates="terapeutas_pivote", overlaps="terapeutas")
    terapeuta = relationship("Terapeuta", back_populates="pacientes_pivote", overlaps="pacientes")


    
    historial_progreso = relationship("HistorialProgreso", back_populates="terapeuta_paciente")


# 📌 Modelo para recibir `JSON` en lugar de `FormData`
class LoginRequest(BaseModel):
    nombre_usuario: str
    contrasena: str
>>>>>>> pruebas
