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
    try:
        terapeuta_dict = terapeuta_data.dict()
        terapeuta_dict["contrasena"] = hash_password(terapeuta_dict["contrasena"])

        response = supabase.table("terapeutas").insert(terapeuta_dict).execute()

        if response.data:
            return {"message": "✅ Terapeuta registrado con éxito", "data": response.data}
        else:
            return {"error": "❌ No se pudo registrar el terapeuta"}
    except Exception as e:
        error_message = str(e).lower()

        if "duplicate key value" in error_message or "violates unique constraint" in error_message:
            if "nombre_usuario" in error_message:
                return {"error": "El nombre de usuario ya está registrado."}
            elif "correo" in error_message:
                return {"error": "El correo electrónico ya está registrado."}
            else:
                return {"error": "Ya existe un terapeuta con los mismos datos."}

        return {"error": f"❌ Error inesperado: {str(e)}"}

