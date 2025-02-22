from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
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

# Modelo para los datos del terapeuta
class Terapeuta(BaseModel):
    nombre_usuario: str
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    correo: str
    contrasena: str
    codigo_postal: str
    calle: str
    colonia: str
    num_ext: str
    num_int: str
    

# Endpoint para insertar un terapeuta
@app.post("/terapeutas/", response_model=dict)
async def create_terapeuta(terapeuta: Terapeuta):
    try:
        data = terapeuta.dict()
        response = supabase.table("terapeutas").insert(data).execute()
        if response.data:
            return {"message": "✅ Terapeuta registrado con éxito", "terapeuta": response.data}
        else:
            raise HTTPException(status_code=400, detail="❌ No se pudo registrar el terapeuta")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al insertar terapeuta: {str(e)}")

# Endpoint para obtener todos los terapeutas
@app.get("/terapeutas/", response_model=dict)
async def get_terapeutas():
    try:
        response = supabase.table("terapeutas").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al obtener terapeutas: {str(e)}")
