from pydantic import BaseModel, constr, EmailStr
from typing import Optional

# 📌 Modelo Pydantic para validar datos del terapeuta
class TerapeutaBase(BaseModel):
    nombre_usuario: constr(strip_whitespace=True, min_length=3, max_length=100)
    nombre: constr(strip_whitespace=True, min_length=1, max_length=100)
    primer_apellido: constr(strip_whitespace=True, min_length=1, max_length=100)
    segundo_apellido: Optional[constr(strip_whitespace=True, max_length=100)] = None
    correo: EmailStr
    contrasena: constr(min_length=6)
    codigo_postal: Optional[constr(strip_whitespace=True, max_length=10)] = None
    calle: Optional[constr(strip_whitespace=True, max_length=255)] = None
    colonia: Optional[constr(strip_whitespace=True, max_length=255)] = None
    num_ext: Optional[constr(strip_whitespace=True, max_length=10)] = None
    num_int: Optional[constr(strip_whitespace=True, max_length=10)] = None

# 📌 Modelo para respuesta (sin contraseña)
class TerapeutaResponse(TerapeutaBase):
    id_terapeuta: int

    class Config:
        from_attributes = True  # Nueva sintaxis en Pydantic v2
