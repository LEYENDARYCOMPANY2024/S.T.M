from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Obtener credenciales de Supabase desde el archivo .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Verificar que las variables existen
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("⚠️ Error: SUPABASE_URL o SUPABASE_KEY no están configuradas en .env")

# Crear el cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Iniciar FastAPI
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "FastAPI + Supabase is running!"}

# ✅ Verificación de conexión a la base de datos
@app.get("/check_db")
async def check_db():
    try:
        response = supabase.table("test").select("*").limit(1).execute()
        if response.data:
            return {"status": "✅ Conexión exitosa a la base de datos", "sample_data": response.data}
        else:
            return {"status": "⚠️ Conexión exitosa, pero la tabla está vacía"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al conectar con la base de datos: {str(e)}")

# ✅ Obtener todos los registros de la tabla "test"
@app.get("/test")
async def get_test():
    try:
        response = supabase.table("test").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al obtener datos: {str(e)}")
