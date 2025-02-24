from pydantic import BaseModel, constr, EmailStr
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Obtener credenciales de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 📌 Modelo Pydantic para validar datos del terapeuta
class TerapeutaBase(BaseModel):
    nombre_usuario: constr(strip_whitespace=True, min_length=3, max_length=100)
    nombre: constr(strip_whitespace=True, min_length=1, max_length=100)
    primer_apellido: constr(strip_whitespace=True, min_length=1, max_length=100)
    segundo_apellido: Optional[constr(strip_whitespace=True, max_length=100)] = None
    correo: EmailStr  # Validación de email
    contrasena: constr(min_length=6)  # Contraseña debe tener mínimo 6 caracteres
    codigo_postal: Optional[constr(strip_whitespace=True, max_length=10)] = None
    calle: Optional[constr(strip_whitespace=True, max_length=255)] = None
    colonia: Optional[constr(strip_whitespace=True, max_length=255)] = None
    num_ext: Optional[constr(strip_whitespace=True, max_length=10)] = None
    num_int: Optional[constr(strip_whitespace=True, max_length=10)] = None

# 📌 Modelo para respuesta (sin contraseña)
class TerapeutaResponse(TerapeutaBase):
    id_terapeuta: int

    class Config:
        orm_mode = True  # Para compatibilidad con ORM

# 📌 Función para registrar un terapeuta
def registrar_terapeuta(terapeuta_data: TerapeutaBase):
    """Registra un nuevo terapeuta en la base de datos."""
    try:
        response = supabase.table("terapeutas").insert(terapeuta_data.dict()).execute()
        if response.data:
            return {"message": "✅ Terapeuta registrado con éxito", "data": response.data}
        else:
            return {"error": "❌ No se pudo registrar el terapeuta"}
    except Exception as e:
        return {"error": f"❌ Error al registrar terapeuta: {str(e)}"}

# 📌 Función para autenticar terapeuta (inicio de sesión)
def autenticar_terapeuta(nombre_usuario: str, contrasena: str):
    """Verifica las credenciales del terapeuta para iniciar sesión."""
    try:
        response = supabase.table("terapeutas").select("id_terapeuta, nombre_usuario, correo").eq("nombre_usuario", nombre_usuario).eq("contrasena", contrasena).execute()
        if response.data:
            return {"message": "✅ Inicio de sesión exitoso", "terapeuta": response.data[0]}
        else:
            return {"error": "❌ Usuario o contraseña incorrectos"}
    except Exception as e:
        return {"error": f"❌ Error al iniciar sesión: {str(e)}"}
