from supabase import create_client, Client
from dotenv import load_dotenv
import os
from models.terapeutas import TerapeutaBase
import bcrypt

# Cargar variables de entorno
load_dotenv()

# Conectar a Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 📌 Función para encriptar contraseña
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def registrar_terapeuta(terapeuta_data: TerapeutaBase):
    """Registra un terapeuta en la base de datos con contraseña encriptada."""
    try:
        terapeuta_dict = terapeuta_data.dict()
        terapeuta_dict["contrasena"] = hash_password(terapeuta_dict["contrasena"])  # Encriptar contraseña
        
        response = supabase.table("terapeutas").insert(terapeuta_dict).execute()
        
        if response.data:
            return {"message": "✅ Terapeuta registrado con éxito", "data": response.data}
        else:
            return {"error": "❌ No se pudo registrar el terapeuta"}
    except Exception as e:
        return {"error": f"❌ Error al registrar terapeuta: {str(e)}"}
