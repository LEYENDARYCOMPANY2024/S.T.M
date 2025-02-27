from supabase import create_client, Client  # Importar desde Supabase
from dotenv import load_dotenv
import os
import bcrypt
import jwt  # Para generar tokens
import datetime  # Para manejar expiración de tokens

# 📌 Cargar variables de entorno
load_dotenv()

# 📌 Configurar URLs correctamente
SUPABASE_URL = os.getenv("SUPABASE_URL")  # 🔹 API REST de Supabase
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # 🔹 Clave de Supabase API
DATABASE_URL = os.getenv("DATABASE_URL")  # 🔹 PostgreSQL para SQLAlchemy
SECRET_KEY = os.getenv("SECRET_KEY", "laMejorsuperkeydelMundo")  # 🔹 Secreto para JWT
ALGORITHM = "HS256"  # 🔹 Algoritmo de encriptación del token
TOKEN_EXPIRATION_MINUTES = 60  # 🔹 Tiempo de expiración (1 hora)

# 🔹 Crear cliente Supabase (API REST)
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ ERROR: SUPABASE_URL o SUPABASE_KEY no están configuradas correctamente en .env")

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

# 📌 Función para generar un token JWT
def generar_token(id_terapeuta: int, nombre_usuario: str):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
    payload = {
        "sub": id_terapeuta,
        "nombre_usuario": nombre_usuario,
        "exp": expiration
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

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
            
            # 📌 Generamos un token JWT
            token = generar_token(terapeuta["id_terapeuta"], terapeuta["nombre_usuario"])

            return {
                "message": "✅ Inicio de sesión exitoso",
                "terapeuta": terapeuta,
                "token": token  # 🔹 Devolvemos el token
            }
        else:
            return {"error": "❌ Usuario o contraseña incorrectos"}
    except Exception as e:
        return {"error": f"❌ Error al iniciar sesión: {str(e)}"}
