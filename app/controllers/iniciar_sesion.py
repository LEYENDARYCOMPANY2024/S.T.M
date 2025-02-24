from supabase import create_client, Client
from dotenv import load_dotenv
import os
import bcrypt

# Cargar variables de entorno
load_dotenv()

# Conectar a Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 📌 Función para verificar si una contraseña está encriptada
def is_hashed(password: str) -> bool:
    return password.startswith("$2b$") or password.startswith("$2a$")

# 📌 Función para verificar la contraseña (encriptada o no)
def verify_password(password: str, stored_password: str) -> bool:
    if is_hashed(stored_password):  # 🔹 Si está encriptada, usamos bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
    else:  # 🔹 Si no está encriptada, comparamos directamente
        return password == stored_password

# 📌 Función para autenticar terapeuta (inicio de sesión)
def autenticar_terapeuta(nombre_usuario: str, contrasena: str):
    """Verifica las credenciales del terapeuta para iniciar sesión."""
    try:
        response = supabase.table("terapeutas").select("id_terapeuta, nombre_usuario, correo, contrasena").eq("nombre_usuario", nombre_usuario).execute()

        if not response.data:
            return {"error": "❌ Usuario o contraseña incorrectos"}

        terapeuta = response.data[0]
        
        if verify_password(contrasena, terapeuta["contrasena"]):  # 🔹 Verificamos la contraseña
            del terapeuta["contrasena"]  # 🔹 Eliminamos la contraseña antes de devolver los datos
            return {"message": "✅ Inicio de sesión exitoso", "terapeuta": terapeuta}
        else:
            return {"error": "❌ Usuario o contraseña incorrectos"}
    except Exception as e:
        return {"error": f"❌ Error al iniciar sesión: {str(e)}"}
